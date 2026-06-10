import { API_URL } from '../config';
import { networkErrorHint, type Locale } from '../i18n';
import type {
  BehaviorPayload,
  CheckResponse,
  LoginResponse,
  RegisterResponse,
  ThreatDashboard,
  TrainResponse,
  UserProfile,
} from '../types';

export { API_URL };

function formatDetail(detail: unknown): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((x) => JSON.stringify(x)).join('; ');
  if (detail && typeof detail === 'object') return JSON.stringify(detail);
  return 'Request failed';
}

async function apiFetch(path: string, init: RequestInit, locale: Locale = 'en'): Promise<Response> {
  try {
    return await fetch(`${API_URL}${path}`, init);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Network error';
    if (/timed out|network request failed|failed to connect|econnrefused/i.test(msg)) {
      throw new Error(networkErrorHint(locale, msg, API_URL));
    }
    throw new Error(msg);
  }
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text || `HTTP ${res.status}`);
  }
}

async function request<T>(path: string, init: RequestInit, locale: Locale = 'en'): Promise<T> {
  const res = await apiFetch(path, init, locale);
  const data = await parseJson<T & { detail?: unknown }>(res);
  if (!res.ok) {
    throw new Error(formatDetail((data as { detail?: unknown }).detail) || `HTTP ${res.status}`);
  }
  return data;
}

export async function checkHealth(): Promise<{ status: string }> {
  return request('/health', { method: 'GET' });
}

export async function registerUser(
  email: string,
  password: string,
  locale: Locale = 'en',
): Promise<RegisterResponse> {
  return request(
    '/register',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    },
    locale,
  );
}

export async function loginUser(
  email: string,
  password: string,
  locale: Locale = 'en',
): Promise<LoginResponse> {
  return request(
    '/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    },
    locale,
  );
}

export async function fetchProfile(userId: string, locale: Locale = 'en'): Promise<UserProfile> {
  return request(`/users/${userId}/profile`, { method: 'GET' }, locale);
}

export async function trainBehavior(
  payload: BehaviorPayload,
  locale: Locale = 'en',
): Promise<TrainResponse> {
  return request(
    '/train',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    locale,
  );
}

export async function checkRisk(
  payload: BehaviorPayload,
  locale: Locale = 'en',
): Promise<CheckResponse> {
  return request(
    '/check',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    locale,
  );
}

export async function fetchThreatDashboard(
  userId: string,
  locale: Locale = 'en',
): Promise<ThreatDashboard> {
  return request(`/users/${userId}/threat-dashboard`, { method: 'GET' }, locale);
}

export async function addTrustedDevice(
  userId: string,
  device: string,
  locale: Locale = 'en',
): Promise<{ message: string }> {
  return request(
    `/users/${userId}/trusted-devices`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device }),
    },
    locale,
  );
}

export async function sendHeartbeat(
  userId: string,
  device: string,
  locale: Locale = 'en',
): Promise<{ message: string }> {
  return request(
    `/users/${userId}/heartbeat`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device }),
    },
    locale,
  );
}
