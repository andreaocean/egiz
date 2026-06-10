export type Locale = 'en' | 'ru' | 'ky';

export type TranslationDict = {
  brand: string;
  nav: {
    dashboard: string;
    register: string;
    training: string;
    check: string;
    result: string;
    threats: string;
    back: string;
  };
  language: {
    title: string;
    en: string;
    ru: string;
    ky: string;
  };
  common: {
    error: string;
    email: string;
    password: string;
    ok: string;
    cancel: string;
    samples: string;
  };
  network: {
    hintTitle: string;
    server: string;
    sameWifi: string;
    backendCmd: string;
    configIp: string;
    testBrowser: string;
  };
  dashboard: {
    badge: string;
    subtitle: string;
    network: string;
    backendOnline: string;
    backendOffline: string;
    checking: string;
    profile: string;
    trainingProgress: string;
    ready: string;
    sessionsNeeded: string;
    signOut: string;
    guestHint: string;
    signUpIn: string;
    trainProfile: string;
    checkRisk: string;
    threatDashboard: string;
    trustDevice: string;
    setupHint: string;
  };
  register: {
    createAccount: string;
    signIn: string;
    hint: string;
    signUpTab: string;
    signInTab: string;
    welcomeTitle: string;
    welcomeBody: string;
    startTraining: string;
    signedInTitle: string;
    signedInBody: string;
  };
  training: {
    title: string;
    hint: string;
    noAccount: string;
    progress: string;
    device: string;
    location: string;
    newSession: string;
    saveSample: string;
    checkRisk: string;
    profileReadyTitle: string;
    profileReadyBody: string;
    keepTraining: string;
    checkRiskBtn: string;
  };
  check: {
    title: string;
    hint: string;
    device: string;
    location: string;
    button: string;
    noAccount: string;
  };
  result: {
    title: string;
    riskScore: string;
    action: string;
    factors: string;
    why: string;
    home: string;
    again: string;
    aiTitle: string;
    mfaTitle: string;
    mfaMethods: string;
    twinTitle: string;
    signalsTitle: string;
    signalEmulator: string;
    signalTravel: string;
  };
  capture: {
    phrase: string;
    phrasePlaceholder: string;
    swipe: string;
    swipeHint: string;
    tap: string;
    tapButton: string;
  };
  risk: {
    notEnough: string;
    low: string;
    medium: string;
    high: string;
    match: string;
    typing_speed: string;
    tap_speed: string;
    swipe_speed: string;
    touch_duration: string;
    unusual_hour: string;
    new_device: string;
    unknown_location: string;
    impossible_travel: string;
    emulator: string;
  };
  action: {
    continue_training: string;
    allow: string;
    step_up: string;
    require_mfa: string;
  };
  threats: {
    title: string;
    subtitle: string;
    live: string;
    noLive: string;
    stats: string;
    avgRisk: string;
    highCount: string;
    checks: string;
    noEvents: string;
  };
  checkExtra: {
    hackerSim: string;
    emulatorOn: string;
  };
};
