import { SecurityError } from '@/lib/fridaDetection';

/** Only local file URIs may be shown or saved (avoids unpinned Image / download paths). */
export function assertLocalImageUri(uri: string): void {
  if (!uri.startsWith('file://')) {
    throw new SecurityError(
      'Remote image URIs are not allowed. Images must be loaded from local cache only.',
    );
  }
}
