import hashlib
import json
import secrets
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from statistics import mean
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

DB_PATH = Path(__file__).resolve().parent / "egiz.db"
MIN_SAMPLES_FOR_CHECK = 3
IMPOSSIBLE_TRAVEL_WINDOW_SEC = 7200
IMPOSSIBLE_TRAVEL_POINTS = 35
EMULATOR_POINTS = 18
app = FastAPI(title="Egiz API", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000)
    return f"{salt}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    if "$" not in stored:
        return password == stored
    salt, digest = stored.split("$", 1)
    check = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000)
    return secrets.compare_digest(check.hex(), digest)


def migrate(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS trusted_devices (
            user_id INTEGER NOT NULL,
            device TEXT NOT NULL,
            created_at TEXT NOT NULL,
            PRIMARY KEY (user_id, device),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS threat_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            risk_score INTEGER NOT NULL,
            status TEXT NOT NULL,
            summary TEXT NOT NULL,
            factors_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS live_sessions (
            user_id INTEGER PRIMARY KEY,
            device TEXT,
            last_ping TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        """
    )


def init_db():
    with get_db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS behavior_samples (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                typing_speed REAL NOT NULL,
                tap_speed REAL NOT NULL,
                swipe_speed REAL NOT NULL,
                touch_duration REAL NOT NULL,
                hour INTEGER NOT NULL,
                device TEXT NOT NULL,
                location TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
            """
        )
        migrate(conn)


@app.on_event("startup")
def on_startup():
    init_db()


class RegisterData(BaseModel):
    email: EmailStr
    password: str = Field(min_length=4, max_length=128)


class LoginData(BaseModel):
    email: EmailStr
    password: str


class BehaviorData(BaseModel):
    user_id: str
    typing_speed: float = Field(ge=0)
    tap_speed: float = Field(ge=0)
    swipe_speed: float = Field(ge=0)
    touch_duration: float = Field(ge=0)
    hour: int = Field(ge=0, le=23)
    device: str = Field(min_length=1, max_length=64)
    location: str = Field(min_length=1, max_length=64)
    is_emulator: bool = False


class TrustedDeviceBody(BaseModel):
    device: str = Field(min_length=1, max_length=64)


class HeartbeatBody(BaseModel):
    device: str = Field(min_length=1, max_length=64)


def _user_id_int(user_id: str) -> int:
    try:
        return int(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid user_id") from exc


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_iso(ts: str) -> datetime | None:
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None


def _get_user(conn: sqlite3.Connection, uid: int) -> sqlite3.Row | None:
    return conn.execute("SELECT id, email FROM users WHERE id = ?", (uid,)).fetchone()


def _load_history(conn: sqlite3.Connection, user_id: int) -> list[dict]:
    rows = conn.execute(
        """
        SELECT typing_speed, tap_speed, swipe_speed, touch_duration, hour, device, location, created_at
        FROM behavior_samples WHERE user_id = ? ORDER BY id
        """,
        (user_id,),
    ).fetchall()
    return [dict(r) for r in rows]


def _trusted_set(conn: sqlite3.Connection, uid: int) -> set[str]:
    rows = conn.execute(
        "SELECT device FROM trusted_devices WHERE user_id = ?",
        (uid,),
    ).fetchall()
    return {r["device"] for r in rows}


def _baseline(history: list[dict]) -> dict | None:
    if not history:
        return None
    return {
        "typing_speed": round(mean(x["typing_speed"] for x in history), 3),
        "tap_speed": round(mean(x["tap_speed"] for x in history), 3),
        "swipe_speed": round(mean(x["swipe_speed"] for x in history), 3),
        "touch_duration": round(mean(x["touch_duration"] for x in history), 3),
        "devices": sorted({x["device"] for x in history}),
        "locations": sorted({x["location"] for x in history}),
    }


def _deviation(current: float, avg: float, threshold: float = 0.5) -> bool:
    return avg > 0 and abs(current - avg) > avg * threshold


def _build_ai_explanation(factors: list[dict], risk: int, trusted_match: bool) -> str:
    if not factors:
        return (
            "Egiz behavioral model: session aligns with your trained interaction fingerprint. "
            "No statistically significant deviations across typing, touch, or device context."
        )
    parts = [
        f"Risk model confidence: elevated score ({risk}/100) driven primarily by "
        f"{len(factors)} independent signal(s)."
    ]
    for f in factors[:4]:
        parts.append(f"• {f['message']} (weight +{f['points']}).")
    if trusted_match:
        parts.append("Trusted device policy reduced baseline suspicion for hardware identity.")
    return " ".join(parts)


def _adaptive_mfa(risk: int, factors: list[dict]) -> dict[str, Any]:
    if risk >= 70:
        return {
            "level": "hard",
            "required": True,
            "methods": ["push_otp", "webauthn_or_passkey"],
            "message": "Step-up to strong MFA before granting access.",
        }
    if risk >= 40:
        return {
            "level": "soft",
            "required": True,
            "methods": ["sms_or_email_otp", "in_app_challenge"],
            "message": "Adaptive MFA: lightweight verification recommended.",
        }
    return {"level": "none", "required": False, "methods": [], "message": "Session cleared adaptive gates."}


def compute_risk(
    data: BehaviorData,
    history: list[dict],
    conn: sqlite3.Connection,
    uid: int,
) -> dict[str, Any]:
    reasons: list[str] = []
    factors: list[dict] = []

    if len(history) < MIN_SAMPLES_FOR_CHECK:
        return {
            "risk_score": 20,
            "status": "Not enough data yet",
            "reasons": [f"Collect at least {MIN_SAMPLES_FOR_CHECK} training samples before risk scoring."],
            "risk_factors": [],
            "action": "Continue training",
            "samples": len(history),
            "ready_for_check": False,
            "ai_explanation": _build_ai_explanation([], 20, False),
            "adaptive_mfa": _adaptive_mfa(20, []),
            "trusted_device_match": False,
            "signals": {"emulator": False, "impossible_travel": False},
            "twin_compare": None,
        }

    trusted = _trusted_set(conn, uid)
    trusted_match = data.device in trusted

    avg_typing = mean(x["typing_speed"] for x in history)
    avg_tap = mean(x["tap_speed"] for x in history)
    avg_swipe = mean(x["swipe_speed"] for x in history)
    avg_touch = mean(x["touch_duration"] for x in history)

    last = history[-1]
    last_loc = last.get("location", "")
    last_ts = _parse_iso(str(last.get("created_at", "")))
    now = datetime.now(timezone.utc)
    impossible = False
    if last_loc and last_loc != data.location and last_ts:
        delta = (now - last_ts).total_seconds()
        if 0 <= delta < IMPOSSIBLE_TRAVEL_WINDOW_SEC:
            impossible = True

    checks: list[tuple[bool, int, str, str]] = [
        (
            _deviation(data.typing_speed, avg_typing),
            25,
            "typing_speed",
            "Different typing speed vs baseline",
        ),
        (_deviation(data.tap_speed, avg_tap), 20, "tap_speed", "Unusual tap rhythm"),
        (_deviation(data.swipe_speed, avg_swipe), 20, "swipe_speed", "Swipe dynamics differ from profile"),
        (_deviation(data.touch_duration, avg_touch), 15, "touch_duration", "Touch duration anomaly"),
        (data.hour < 6, 10, "unusual_hour", "Session outside usual hours (before 6:00)"),
    ]

    known_devices = {x["device"] for x in history}
    new_device = data.device not in known_devices
    if new_device and trusted_match:
        new_device = False

    if new_device:
        checks.append((True, 20, "new_device", "New device"))

    known_locations = {x["location"] for x in history}
    if data.location not in known_locations:
        checks.append((True, 20, "unknown_location", "Unknown location"))

    if impossible:
        checks.append(
            (
                True,
                IMPOSSIBLE_TRAVEL_POINTS,
                "impossible_travel",
                "Impossible travel: location changed too fast vs last training sample",
            )
        )

    if data.is_emulator:
        checks.append((True, EMULATOR_POINTS, "emulator", "Emulator / non-device environment detected"))

    risk = 0
    for triggered, points, key, message in checks:
        if triggered:
            risk += points
            reasons.append(message)
            factors.append({"id": key, "points": points, "message": message})

    risk = min(risk, 100)

    if risk >= 70:
        status, action = "High risk", "Require MFA"
    elif risk >= 40:
        status, action = "Medium risk", "Step-up verification"
    else:
        status, action = "Low risk", "Allow"

    if not reasons:
        reasons.append("Behavior matches your Egiz profile")

    bl = _baseline(history)
    twin_compare = None
    if bl:
        twin_compare = {
            "baseline": bl,
            "current": {
                "typing_speed": round(data.typing_speed, 3),
                "tap_speed": round(data.tap_speed, 3),
                "swipe_speed": round(data.swipe_speed, 3),
                "touch_duration": round(data.touch_duration, 3),
            },
            "delta_pct": {
                "typing_speed": _delta_pct(data.typing_speed, bl["typing_speed"]),
                "tap_speed": _delta_pct(data.tap_speed, bl["tap_speed"]),
                "swipe_speed": _delta_pct(data.swipe_speed, bl["swipe_speed"]),
                "touch_duration": _delta_pct(data.touch_duration, bl["touch_duration"]),
            },
        }

    return {
        "risk_score": risk,
        "status": status,
        "reasons": reasons,
        "risk_factors": factors,
        "action": action,
        "samples": len(history),
        "ready_for_check": True,
        "ai_explanation": _build_ai_explanation(factors, risk, trusted_match),
        "adaptive_mfa": _adaptive_mfa(risk, factors),
        "trusted_device_match": trusted_match,
        "signals": {
            "emulator": data.is_emulator,
            "impossible_travel": impossible,
        },
        "twin_compare": twin_compare,
    }


def _delta_pct(cur: float, base: float) -> float:
    if base == 0:
        return 0.0
    return round((cur - base) / base * 100.0, 1)


@app.get("/health")
def health():
    return {"status": "ok", "service": "egiz", "version": "0.3.0"}


@app.post("/register")
def register(data: RegisterData):
    with get_db() as conn:
        try:
            cur = conn.execute(
                "INSERT INTO users (email, password, created_at) VALUES (?, ?, ?)",
                (data.email, hash_password(data.password), _utc_now()),
            )
            user_id = str(cur.lastrowid)
        except sqlite3.IntegrityError as e:
            raise HTTPException(status_code=409, detail="Email already registered") from e

    return {"message": "User registered", "user_id": user_id, "email": data.email}


@app.post("/login")
def login(data: LoginData):
    with get_db() as conn:
        row = conn.execute("SELECT id, email, password FROM users WHERE email = ?", (data.email,)).fetchone()
        if not row or not verify_password(data.password, row["password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        uid = row["id"]
        samples = conn.execute(
            "SELECT COUNT(*) FROM behavior_samples WHERE user_id = ?",
            (uid,),
        ).fetchone()[0]

    return {
        "message": "Login successful",
        "user_id": str(uid),
        "email": row["email"],
        "samples": samples,
    }


@app.get("/users/{user_id}/profile")
def profile(user_id: str):
    uid = _user_id_int(user_id)
    with get_db() as conn:
        user = _get_user(conn, uid)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        history = _load_history(conn, uid)
        trusted = sorted(_trusted_set(conn, uid))

    count = len(history)
    return {
        "user_id": user_id,
        "email": user["email"],
        "samples": count,
        "min_samples": MIN_SAMPLES_FOR_CHECK,
        "ready_for_check": count >= MIN_SAMPLES_FOR_CHECK,
        "baseline": _baseline(history),
        "trusted_devices": trusted,
    }


@app.post("/users/{user_id}/trusted-devices")
def add_trusted_device(user_id: str, body: TrustedDeviceBody):
    uid = _user_id_int(user_id)
    with get_db() as conn:
        if not _get_user(conn, uid):
            raise HTTPException(status_code=404, detail="User not found")
        conn.execute(
            "INSERT OR REPLACE INTO trusted_devices (user_id, device, created_at) VALUES (?, ?, ?)",
            (uid, body.device.strip(), _utc_now()),
        )
    return {"message": "Trusted device saved", "device": body.device.strip()}


@app.delete("/users/{user_id}/trusted-devices")
def remove_trusted_device(user_id: str, device: str = Query(..., min_length=1)):
    uid = _user_id_int(user_id)
    with get_db() as conn:
        conn.execute(
            "DELETE FROM trusted_devices WHERE user_id = ? AND device = ?",
            (uid, device),
        )
    return {"message": "Removed", "device": device}


@app.post("/users/{user_id}/heartbeat")
def heartbeat(user_id: str, body: HeartbeatBody):
    uid = _user_id_int(user_id)
    with get_db() as conn:
        if not _get_user(conn, uid):
            raise HTTPException(status_code=404, detail="User not found")
        conn.execute(
            """
            INSERT INTO live_sessions (user_id, device, last_ping) VALUES (?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET device=excluded.device, last_ping=excluded.last_ping
            """,
            (uid, body.device.strip(), _utc_now()),
        )
    return {"message": "ok", "last_ping": _utc_now()}


@app.get("/users/{user_id}/threat-dashboard")
def threat_dashboard(user_id: str):
    uid = _user_id_int(user_id)
    with get_db() as conn:
        if not _get_user(conn, uid):
            raise HTTPException(status_code=404, detail="User not found")
        events = conn.execute(
            """
            SELECT id, risk_score, status, summary, created_at
            FROM threat_log WHERE user_id = ? ORDER BY id DESC LIMIT 25
            """,
            (uid,),
        ).fetchall()
        live = conn.execute(
            "SELECT device, last_ping FROM live_sessions WHERE user_id = ?",
            (uid,),
        ).fetchone()
        high = sum(1 for e in ev_list if e["risk_score"] >= 70)

    ev_list = [dict(r) for r in events]
    avg = 0.0
    if ev_list:
        avg = round(mean(e["risk_score"] for e in ev_list), 1)

    return {
        "events": ev_list,
        "stats": {
            "checks_recorded": len(ev_list),
            "avg_risk_recent": avg,
            "high_risk_events_recent": high,
        },
        "live_session": dict(live) if live else None,
    }


@app.post("/train")
def train(data: BehaviorData):
    uid = _user_id_int(data.user_id)
    with get_db() as conn:
        if not _get_user(conn, uid):
            raise HTTPException(status_code=404, detail="User not found")

        payload = data.model_dump()
        conn.execute(
            """
            INSERT INTO behavior_samples
            (user_id, typing_speed, tap_speed, swipe_speed, touch_duration, hour, device, location, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                uid,
                payload["typing_speed"],
                payload["tap_speed"],
                payload["swipe_speed"],
                payload["touch_duration"],
                payload["hour"],
                payload["device"],
                payload["location"],
                _utc_now(),
            ),
        )
        count = conn.execute(
            "SELECT COUNT(*) FROM behavior_samples WHERE user_id = ?",
            (uid,),
        ).fetchone()[0]

    return {
        "message": "Behavior saved",
        "samples": count,
        "ready_for_check": count >= MIN_SAMPLES_FOR_CHECK,
    }


@app.post("/check")
def check(data: BehaviorData):
    uid = _user_id_int(data.user_id)
    with get_db() as conn:
        if not _get_user(conn, uid):
            raise HTTPException(status_code=404, detail="User not found")
        history = _load_history(conn, uid)
        result = compute_risk(data, history, conn, uid)

        if result.get("ready_for_check"):
            summary = result["ai_explanation"][:280]
            conn.execute(
                """
                INSERT INTO threat_log (user_id, risk_score, status, summary, factors_json, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    uid,
                    int(result["risk_score"]),
                    result["status"],
                    summary,
                    json.dumps(result["risk_factors"]),
                    _utc_now(),
                ),
            )

    return result
