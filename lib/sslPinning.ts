import {
  initializeSslPinning,
  isSslPinningAvailable,
} from 'react-native-ssl-public-key-pinning';

export const PINNED_HOST = 'ai.elliottwen.info';

// Replace with base64 SHA-256 SPKI hashes from the server certificate chain.
const PRIMARY_SPKI_HASH = 'PRIMARY_SPKI_HASH';
const BACKUP_SPKI_HASH = 'BACKUP_SPKI_HASH';

/** Enables SSL public key pinning for the AI API host (development builds only). */
export async function setupSslPinning(): Promise<void> {
  if (!isSslPinningAvailable()) {
    // Expo Go and web have no native pinning module.
    return;
  }

  await initializeSslPinning({
    [PINNED_HOST]: {
      includeSubdomains: false,
      publicKeyHashes: [PRIMARY_SPKI_HASH, BACKUP_SPKI_HASH],
    },
  });
}
