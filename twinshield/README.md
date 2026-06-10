# Egiz

**Behavioral identity for every sign-in.**

Egiz is a hackathon MVP that learns how *you* type, tap, and swipe—then scores each new session for impersonation risk. Mobile app (Expo) + FastAPI backend + SQLite.

---

## What it does

1. **Register** — create an account with a hashed password  
2. **Train** — capture 3–5 calm interaction samples (typing, taps, swipes)  
3. **Check** — compare a new session to your behavioral baseline  
4. **Act** — get a risk score, status, and recommended action (Allow → MFA)

### Hackathon showcase (v0.3)

| Feature | What judges see |
|--------|------------------|
| **Risk score + AI explanation** | Narrative summary of why the model fired |
| **Adaptive MFA** | `none` / `soft` / `hard` with suggested methods |
| **Trusted device** | Register current handset; lowers “new device” suspicion |
| **Threat Center** | Log of recent checks + live session (heartbeat from Dashboard) |
| **Impossible travel** | New location vs last training sample within 2h → spike |
| **Emulator detection** | `expo-device` + optional demo toggle on Verify |
| **Digital twin viz** | Δ% bars: typing / tap / swipe / touch vs baseline |
| **Hacker simulation** | One-tap “attacker” preset on Verify screen |

New API: `POST /users/{id}/trusted-devices`, `POST /users/{id}/heartbeat`, `GET /users/{id}/threat-dashboard`, `DELETE /users/{id}/trusted-devices?device=...`

---

## Project layout

```
twinshield/
  backend/     FastAPI + SQLite
  mobile/      Expo / React Native
```

---

## Backend

```powershell
cd backend
.\start.ps1
```

Or manually:

```powershell
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --reload --port 8000
```

API docs: http://127.0.0.1:8000/docs

### Port already in use (`WinError 10013`)

```powershell
netstat -ano | findstr ":8000"
taskkill /PID <PID> /F
```

Or use another port and update `API_URL` in the mobile app:

```powershell
uvicorn main:app --host 0.0.0.0 --reload --port 8001
```

---

## Mobile

1. Find your PC’s IPv4: `ipconfig` — use **Wi‑Fi** or phone hotspot, not a virtual adapter (`192.168.165.x`).  
2. Set `mobile/src/config.ts`: `API_URL = "http://YOUR_IP:8000"`.  
3. Phone and PC must share **one network** (same Wi‑Fi or PC on phone hotspot). Cellular-only won’t work.  
4. Allow inbound traffic (PowerShell **as Administrator**):

```powershell
netsh advfirewall firewall add rule name="Egiz API" dir=in action=allow protocol=TCP localport=8000
```

5. On the phone browser, open `http://YOUR_IP:8000/docs` — Swagger should load.

```powershell
cd mobile
npm install
npx expo start -c
```

Scan the QR code in **Expo Go** (iOS / Android).

---

## Demo script (judges)

| Step | What to show |
|------|----------------|
| Register | New user, session saved on device |
| Training | 3–5 normal sessions → progress bar fills |
| Check (normal) | Low risk, **Allow** |
| Check (attack) | Fast typing, many taps, `device: Unknown`, `location: Unknown` → **High risk**, **Require MFA**, factor breakdown |

---

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service status |
| POST | `/register` | Sign up (PBKDF2 password hash) |
| POST | `/login` | Sign in |
| GET | `/users/{id}/profile` | Samples, baseline, trusted devices, readiness |
| POST | `/users/{id}/trusted-devices` | Mark device as trusted |
| DELETE | `/users/{id}/trusted-devices?device=...` | Remove trusted device |
| POST | `/users/{id}/heartbeat` | Live session ping (Dashboard) |
| GET | `/users/{id}/threat-dashboard` | Threat log + stats + live session |
| POST | `/train` | Save a behavior sample |
| POST | `/check` | Full risk payload: AI explanation, adaptive MFA, twin Δ%, signals |

---

## MVP highlights (v0.3)

- Everything in v0.2, plus: **AI explanation**, **adaptive MFA levels**, **trusted devices**, **threat dashboard**, **impossible travel**, **emulator flag**, **digital twin Δ% viz**, **hacker simulation** preset  
- `expo-device` for simulator detection on Verify  

---

## Languages

The mobile app supports **English**, **Russian**, and **Kyrgyz**. The product name **Egiz** stays in English on all screens. Change language on the home screen.

## Tagline

> **Egiz** — *Your behavior is the key. Everything else is just a guess.*
