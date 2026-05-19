import { NativeModule, requireNativeModule } from 'expo';
import { Platform } from 'react-native';

declare class FridaDetectionNativeModule extends NativeModule {
  isFridaDetected(): Promise<boolean>;
}

function loadNativeModule(): FridaDetectionNativeModule | null {
  if (Platform.OS !== 'android') {
    return null;
  }
  try {
    return requireNativeModule<FridaDetectionNativeModule>('FridaDetection');
  } catch {
    return null;
  }
}

const nativeModule = loadNativeModule();

export function isFridaDetectionNativeAvailable(): boolean {
  return nativeModule != null;
}

export async function isFridaDetected(): Promise<boolean> {
  if (!nativeModule) {
    return false;
  }
  return nativeModule.isFridaDetected();
}

export default nativeModule;
