import { Platform } from 'react-native';
import {
  isFridaDetected as nativeIsFridaDetected,
  isFridaDetectionNativeAvailable,
} from 'frida-detection';

let cachedFridaDetected: boolean | null = null;

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

/** True when the native Frida detection module is linked (custom dev build). */
export function isFridaDetectionAvailable(): boolean {
  return Platform.OS === 'android' && isFridaDetectionNativeAvailable();
}

/**
 * Runs native detection. Fail-closed: bridge/native errors count as detected.
 * Unavailable module (e.g. Expo Go) returns false so UI-only dev still works.
 */
async function runFridaDetection(): Promise<boolean> {
  if (!isFridaDetectionAvailable()) {
    return false;
  }

  try {
    return await nativeIsFridaDetected();
  } catch (error) {
    console.warn('Frida detection error (fail-closed):', error);
    return true;
  }
}

/** Runs native Frida checks and caches the result for the session. */
export async function setupFridaDetection(): Promise<boolean> {
  const detected = await runFridaDetection();
  cachedFridaDetected = detected;
  return detected;
}

export function getFridaDetectionResult(): boolean {
  return cachedFridaDetected ?? false;
}

/** Re-runs native detection (e.g. before API calls or periodic recheck). */
export async function detectFrida(): Promise<boolean> {
  const detected = await runFridaDetection();
  if (detected) {
    cachedFridaDetected = true;
  }
  return detected;
}

export async function assertSafeEnvironment(): Promise<void> {
  const detected = await detectFrida();
  if (detected) {
    throw new SecurityError(
      'This device appears to be running dynamic analysis tooling. The app cannot continue.',
    );
  }
}
