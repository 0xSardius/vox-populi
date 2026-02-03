'use client';

import { sdk } from '@farcaster/miniapp-sdk';

export { sdk };

/**
 * Check if running inside a Farcaster client
 */
export function isInFarcasterClient(): boolean {
  if (typeof window === 'undefined') return false;
  return window.parent !== window;
}

/**
 * Get the current user's context from the Farcaster SDK
 */
export async function getContext() {
  try {
    return sdk.context;
  } catch {
    return null;
  }
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
