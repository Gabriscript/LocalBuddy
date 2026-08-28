import { PlayfairDisplay_600SemiBold, useFonts } from '@expo-google-fonts/playfair-display';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
  // Only the display weight is loaded: body text uses the system face, which already
  // follows the reader's Dynamic Type setting and costs nothing to download.
  const [fontsLoaded] = useFonts({ PlayfairDisplay_600SemiBold });

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
