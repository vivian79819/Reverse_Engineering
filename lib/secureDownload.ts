import * as FileSystem from 'expo-file-system/legacy';

import { PINNED_HOST } from '@/lib/sslPinning';

function assertPinnedRemoteUrl(url: string): void {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.hostname !== PINNED_HOST) {
    throw new Error(`Download blocked: only https://${PINNED_HOST} assets are allowed.`);
  }
}

/** Downloads via fetch so traffic uses the same pinned TLS stack as API calls. */
export async function downloadPinnedAsset(
  remoteUrl: string,
  localUri: string,
): Promise<{ uri: string }> {
  assertPinnedRemoteUrl(remoteUrl);

  const response = await fetch(remoteUrl);
  if (!response.ok) {
    throw new Error(`Failed to download asset (${response.status}).`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  const base64 = btoa(binary);

  await FileSystem.writeAsStringAsync(localUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return { uri: localUri };
}
