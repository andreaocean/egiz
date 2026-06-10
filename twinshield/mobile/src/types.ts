export type BehaviorPayload = {
  user_id: string;
  typing_speed: number;
  tap_speed: number;
  swipe_speed: number;
  touch_duration: number;
  hour: number;
  device: string;
  location: string;
  is_emulator: boolean;
};

export type RegisterResponse = {
  message: string;
  user_id: string;
  email: string;
};

export type LoginResponse = {
  message: string;
  user_id: string;
  email: string;
  samples: number;
};

export type TrainResponse = {
  message: string;
  samples: number;
  ready_for_check: boolean;
};

export type RiskFactor = {
  id: string;
  points: number;
  message: string;
};

export type AdaptiveMfa = {
  level: string;
  required: boolean;
  methods: string[];
  message: string;
};

export type TwinCompare = {
  baseline: Record<string, unknown>;
  current: Record<string, unknown>;
  delta_pct: Record<string, number>;
};

export type CheckResponse = {
  risk_score: number;
  status: string;
  reasons: string[];
  risk_factors: RiskFactor[];
  action: string;
  samples?: number;
  ready_for_check?: boolean;
  ai_explanation?: string;
  adaptive_mfa?: AdaptiveMfa;
  trusted_device_match?: boolean;
  signals?: { emulator: boolean; impossible_travel: boolean };
  twin_compare?: TwinCompare | null;
};

export type UserProfile = {
  user_id: string;
  email: string;
  samples: number;
  min_samples: number;
  ready_for_check: boolean;
  baseline: {
    typing_speed: number;
    tap_speed: number;
    swipe_speed: number;
    touch_duration: number;
    devices: string[];
    locations: string[];
  } | null;
  trusted_devices?: string[];
};

export type ThreatEvent = {
  id: number;
  risk_score: number;
  status: string;
  summary: string;
  created_at: string;
};

export type ThreatDashboard = {
  events: ThreatEvent[];
  stats: {
    checks_recorded: number;
    avg_risk_recent: number;
    high_risk_events_recent: number;
  };
  live_session: { device: string; last_ping: string } | null;
};
