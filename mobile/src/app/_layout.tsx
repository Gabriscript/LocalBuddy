import { Geist_400Regular } from '@expo-google-fonts/geist/400Regular';
import { Geist_600SemiBold } from '@expo-google-fonts/geist/600SemiBold';
import { PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display/600SemiBold';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { ApiError } from '@/api/client';
import { AuthProvider } from '@/lib/auth';
import { useColors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

/// The two providers the whole app needs, and nothing else. Server data lives in Query,
/// the session lives in AuthProvider, and there is no third global store (ADR-0009).
export default function RootLayout() {
  const c = useColors();
  // Three faces, imported one weight at a time so the bundle carries three files rather
  // than the whole family. Playfair says the name of a person or a place; Geist says
  // everything else. Leaving the body to the system face meant the app read as iOS on an
  // iPhone and as Windows in the browser, which is a voice chosen by the device.
  const [fontsLoaded] = useFonts({ PlayfairDisplay_600SemiBold, Geist_400Regular, Geist_600SemiBold });

  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Retrying a 400/401/403/404 just repeats a refusal the server already explained.
            retry: (failures, error) =>
              failures < 2 && !(error instanceof ApiError && error.status < 500),
          },
        },
      })
  );

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  // Held on the splash rather than rendering a frame in a fallback face and reflowing.
  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background } }} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
