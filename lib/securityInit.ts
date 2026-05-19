import { getFridaDetectionResult, setupFridaDetection } from '@/lib/fridaDetection';
import { setupSslPinning } from '@/lib/sslPinning';

export type SecurityInitResult = {
  fridaDetected: boolean;
};

/** Initializes SSL pinning and Frida detection in parallel. */
export async function initializeAppSecurity(): Promise<SecurityInitResult> {
  await Promise.all([
    setupSslPinning().catch((error) => {
      console.warn('SSL pinning init failed:', error);
    }),
    setupFridaDetection(),
  ]);

  return {
    fridaDetected: getFridaDetectionResult(),
  };
}
