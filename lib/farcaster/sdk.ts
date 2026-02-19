'use client';

import { sdk } from '@farcaster/miniapp-sdk';

export { sdk };

/**
 * Check if running inside a Farcaster Mini App using the SDK's
 * built-in detection (iframe + context verification).
 * Falls back to false after timeout.
 */
export async function isInMiniApp(): Promise<boolean> {
  try {
    return await sdk.isInMiniApp();
  } catch {
    return false;
  }
}

/**
 * Race a promise against a timeout. Returns fallback if the promise
 * doesn't resolve within `ms` milliseconds.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

/**
 * Get Quick Auth token for authenticated API requests
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const result = await sdk.quickAuth.getToken();
    return result.token;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}

/**
 * Authenticated fetch wrapper that adds Quick Auth token
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
