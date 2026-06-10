import * as Device from 'expo-device';
import { getLocales } from 'expo-localization';

export type DeviceFingerprint = {
  device: string;
  os_name: string;
  device_model: string;
  is_emulator: boolean;
  timezone: string;
  language: string;
  display_label: string;
};

export function collectDeviceFingerprint(forceEmulator = false): DeviceFingerprint {
  const isEmulator = forceEmulator || !Device.isDevice;
  const model = Device.modelName ?? Device.deviceName ?? 'Unknown device';
  const osName = Device.osName ?? 'OS';
  const osVersion = Device.osVersion ?? '';
  const os_name = `${osName} ${osVersion}`.trim();
  const locales = getLocales();
  const language = locales[0]?.languageTag ?? locales[0]?.languageCode ?? 'en';
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';

  const display_label = isEmulator
    ? 'Unknown Emulator'
    : model.length > 2
      ? model
      : `${osName} device`;

  const device = isEmulator ? 'Emulator' : model;

  return {
    device,
    os_name,
    device_model: model,
    is_emulator: isEmulator,
    timezone,
    language,
    display_label,
  };
}
