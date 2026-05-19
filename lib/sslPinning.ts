import {
  initializeSslPinning,
  isSslPinningAvailable,
} from 'react-native-ssl-public-key-pinning';

export const PINNED_HOST = 'ai.elliottwen.info';

// Leaf cert (ai.elliottwen.info) and intermediate CA backup pin.
const PRIMARY_SPKI_HASH = 'Y+qVcAbTbJUkv0N0yR2D7+qaY+yBS8BGRAG0U5ukZec=';
const BACKUP_SPKI_HASH = 'kIdp6NNEd8wsugYyyIYFsi1ylMCED3hZbSR8ZFsa/A4=';

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
