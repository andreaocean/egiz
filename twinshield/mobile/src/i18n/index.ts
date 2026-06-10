import { en } from './locales/en';
import { ky } from './locales/ky';
import { ru } from './locales/ru';
import type { Locale, TranslationDict } from './types';

export type { Locale, TranslationDict };

export const LOCALES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'ky', label: 'Кыргызча' },
];

const catalogs: Record<Locale, TranslationDict> = { en, ru, ky };

export function getTranslations(locale: Locale): TranslationDict {
  return catalogs[locale] ?? en;
}

export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ''));
}

export type RiskReasonKey = keyof TranslationDict['risk'];
export type ActionKey = keyof TranslationDict['action'];

export function translateRiskStatus(
  locale: Locale,
  status: string,
): string {
  const t = getTranslations(locale).risk;
  const map: Record<string, string> = {
    'Low risk': t.low,
    'Medium risk': t.medium,
    'High risk': t.high,
    'Not enough data yet': getTranslations(locale).risk.notEnough,
  };
  return map[status] ?? status;
}

export function translateAction(locale: Locale, action: string): string {
  const t = getTranslations(locale).action;
  const map: Record<string, string> = {
    Allow: t.allow,
    'Step-up verification': t.step_up,
    'Require MFA': t.require_mfa,
    'Continue training': t.continue_training,
  };
  return map[action] ?? action;
}

export function translateReason(locale: Locale, text: string, factorId?: string): string {
  const t = getTranslations(locale).risk;
  if (factorId && factorId in t) {
    return t[factorId as RiskReasonKey];
  }
  const byEnglish: Record<string, RiskReasonKey> = {
    'Different typing speed vs baseline': 'typing_speed',
    'Unusual tap rhythm': 'tap_speed',
    'Swipe dynamics differ from profile': 'swipe_speed',
    'Touch duration anomaly': 'touch_duration',
    'Session outside usual hours (before 6:00)': 'unusual_hour',
    'New device': 'new_device',
    'Unknown location': 'unknown_location',
    'Behavior matches your Egiz profile': 'match',
    'Collect at least 3 training samples before risk scoring.': 'notEnough',
    'Impossible travel: location changed too fast vs last training sample': 'impossible_travel',
    'Emulator / non-device environment detected': 'emulator',
    'Поведение совпадает с профилем Egiz': 'match',
  };
  const key = byEnglish[text];
  return key ? t[key] : text;
}

export function networkErrorHint(locale: Locale, message: string, apiUrl: string): string {
  const n = getTranslations(locale).network;
  return (
    `${message}\n\n` +
    `${n.server}: ${apiUrl}\n` +
    `${n.sameWifi}\n` +
    `${n.backendCmd}\n` +
    `${n.configIp}\n` +
    `${n.testBrowser}`
  );
}
