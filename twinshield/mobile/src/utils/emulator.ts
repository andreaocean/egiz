import * as Device from 'expo-device';

/** True when running on simulator / emulator (not a physical device). */
export function isLikelyEmulator(): boolean {
  try {
    return !Device.isDevice;
  } catch {
    return false;
  }
}
