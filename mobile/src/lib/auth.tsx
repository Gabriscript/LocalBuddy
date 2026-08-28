import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api, setAuthToken, setUnauthorizedHandler, unwrap } from '@/api/client';

import { tokenStore } from './storage';

const TOKEN_KEY = 'localbuddy.token';

type Credentials = { email: string; password: string };
type Registration = Credentials & { name: string; city: string; role: string };

type Auth = {
  token: string | null;
  signIn: (c: Credentials) => Promise<void>;
  register: (r: Registration) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<Auth | null>(null);

export function useAuth(): Auth {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  // Nothing below this provider renders until the stored token has been read. Routes outside
  // the tab group — /user/[id], /chat/[id], anything a deep link or a push notification opens
  // on a cold start — carry no guard of their own, so their queries would otherwise fire
  // before the token existed, take a 401, and sign the member out on the way in.
  const [ready, setReady] = useState(false);

  function keep(next: string | null) {
    setAuthToken(next);
    setToken(next);
    return next ? tokenStore.set(TOKEN_KEY, next) : tokenStore.remove(TOKEN_KEY);
  }

  useEffect(() => {
    tokenStore
      .get(TOKEN_KEY)
      .then((stored) => {
        setAuthToken(stored);
        setToken(stored);
      })
      .finally(() => setReady(true));

    // Any 401 anywhere in the app lands here.
    setUnauthorizedHandler(() => void keep(null));
  }, []);

  const value = useMemo<Auth>(
    () => ({
      token,
      signIn: async (body) => {
        const result = unwrap(await api.POST('/api/v1/auth/login', { body }));
        await keep(result.token);
      },
      register: async (body) => {
        const result = unwrap(await api.POST('/api/v1/auth/register', { body }));
        await keep(result.token);
      },
      signOut: () => keep(null).then(() => undefined),
    }),
    [token]
  );

  // After every hook, never before one.
  if (!ready) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
