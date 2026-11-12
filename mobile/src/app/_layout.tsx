import { Geist_400Regular } from '@expo-google-fonts/geist/400Regular';
import { Geist_600SemiBold } from '@expo-google-fonts/geist/600SemiBold';
import { PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display/600SemiBold';
import { focusManager, QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { router, Stack, useRootNavigationState, type Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { ApiError } from '@/api/client';
import { keys } from '@/api/hooks';
import { LanguageProvider } from '@/i18n';
import { AuthProvider } from '@/lib/auth';
import { useColors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

/// The providers the whole app needs, and nothing else. Server data lives in Query, the
/// session lives in AuthProvider, and the language in LanguageProvider: the one setting that is
/// not a copy of a server row (ADR-0009).
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

  // Query has no idea what a phone's background is: without this its polling keeps running
  // there, and coming back to the app would not refresh anything.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => focusManager.setFocused(state === 'active'));
    return () => sub.remove();
  }, []);

  // Held on the splash rather than rendering a frame in a fallback face and reflowing.
  if (!fontsLoaded) return null;

  return (
    <LanguageProvider>
      <QueryClientProvider client={client}>
        <AuthProvider>
          <StatusBar style="auto" />
          <PushRouting />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background } }} />
        </AuthProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
}

/// Inside AuthProvider, so a tap that launched the app opens its screen only once the stored
/// session has been read and the navigator exists.
function PushRouting() {
  const client = useQueryClient();
  // A cold-start tap must wait for the root navigator, or router.push has nothing to push to.
  const ready = !!useRootNavigationState()?.key;

  useEffect(() => {
    if (Platform.OS === 'web' || !ready) return;

    // The server puts the route to open in data.url: /requests or /chat/{id} (ADR-0012).
    // The last response and the listener can report the same tap: open each one once.
    let handled: string | null = null;
    const open = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const url = response.notification.request.content.data?.url;
      const id = response.notification.request.identifier;
      if (typeof url !== 'string' || !url.startsWith('/') || id === handled) return;
      handled = id;
      router.push(url as Href);
    };
    open(Notifications.getLastNotificationResponse()); // the tap that started the app, if any
    const taps = Notifications.addNotificationResponseReceivedListener(open);

    // Arriving while the app is open: refresh now rather than at the next poll.
    const arrivals = Notifications.addNotificationReceivedListener(() => {
      client.invalidateQueries({ queryKey: keys.requests });
      client.invalidateQueries({ queryKey: keys.conversations });
    });

    return () => {
      taps.remove();
      arrivals.remove();
    };
  }, [client, ready]);

  return null;
}
