import createClient, { type Middleware } from 'openapi-fetch';

import type { paths } from './generated';

/// An emulator or a phone cannot reach the host's localhost. Set EXPO_PUBLIC_API_URL to the
/// LAN address of the machine running the API before testing on a device.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5200';

let token: string | null = null;
let onUnauthorized: () => void = () => {};

/// The token is held here, outside React, because the fetch middleware and AuthedImage both
/// need it synchronously. lib/auth is the only writer.
export function setAuthToken(next: string | null) {
  token = next;
}

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

/// Photos are fetched by <Image>, not by this client, and still need the header: a bare URL
/// gets 404 on any host who restricted visibility (ADR-0006, ADR-0009).
export function authHeaders(): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const auth: Middleware = {
  async onRequest({ request }) {
    if (token) request.headers.set('Authorization', `Bearer ${token}`);
    return request;
  },
  async onResponse({ response }) {
    // The access token is a 30-day JWT with no refresh flow (ADR-0009). A 401 means it
    // expired or the account is gone: there is nothing to retry with, so end the session.
    if (response.status === 401) onUnauthorized();
    return response;
  },
};

export const api = createClient<paths>({ baseUrl: API_URL });
api.use(auth);

/// The RFC 7807 body every deliberate failure carries (ADR-0008). Switch on `code`, which is
/// stable; never on `message`, which is prose the backend may reword.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Problem = { code?: string; detail?: string; title?: string };

/// openapi-fetch returns { data, error }; TanStack Query wants a throw. Every hook unwraps
/// here so failures reach the UI in exactly one shape.
export function unwrap<T>(result: { data?: T; error?: unknown; response: Response }): T {
  const { data, error, response } = result;
  if (!response.ok || error !== undefined) {
    const problem = (error ?? {}) as Problem;
    throw new ApiError(
      response.status,
      problem.code ?? 'unknown',
      problem.detail ?? problem.title ?? response.statusText
    );
  }
  return data as T;
}
