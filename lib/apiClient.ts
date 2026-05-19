import { PINNED_HOST } from '@/lib/sslPinning';

export const API_BASE_URL = `https://${PINNED_HOST}`;

function assertPinnedUrl(url: string): void {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.hostname !== PINNED_HOST) {
    throw new Error(`Request blocked: only https://${PINNED_HOST} is allowed.`);
  }
}

export async function postAuth(
  apiKey: string,
  signal?: AbortSignal,
): Promise<{ signature: string }> {
  const url = `${API_BASE_URL}/auth`;
  assertPinnedUrl(url);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
    },
    signal,
  });

  if (!response.ok) {
    throw new Error('Authentication failed.');
  }

  return response.json();
}

export async function postGenerateImage(
  apiKey: string,
  signature: string,
  prompt: string,
  signal?: AbortSignal,
): Promise<string> {
  const url = `${API_BASE_URL}/generate_image`;
  assertPinnedUrl(url);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      signature,
      prompt,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error('Failed to generate image from server.');
  }

  let imagePath = await response.text();
  imagePath = imagePath.replace(/"/g, '').trim();
  return imagePath;
}

export function buildPinnedAssetUrl(relativePath: string): string {
  const normalized = relativePath.replace(/^\//, '');
  const url = `${API_BASE_URL}/${normalized}`;
  assertPinnedUrl(url);
  return url;
}
