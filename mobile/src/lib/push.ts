import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { api, unwrap } from '@/api/client';

/// Push is best effort (ADR-0012): every failure here is swallowed, and the polling in
/// api/hooks keeps the screens current without it. Nothing runs on web.

/// Without a handler a notification that arrives while the app is open is not shown at all.
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/// What this device registered for the signed-in member, so signing out can take it back.
let registered: string | null = null;
/// Bumped by every sign-out: a registration still in flight then knows its session is gone.
let generation = 0;

/// Sends this device's push token to the server with the app's language. Asks the member for
/// permission only when `ask` is set — after they send an interest, never at launch.
export async function registerPush(language: string, channelName: string, ask = false) {
  if (Platform.OS === 'web' || (ask && registered)) return;
  const started = generation;
  try {
    // The server sends to this channel id, and Android 13+ shows no permission prompt until a
    // channel exists.
    await Notifications.setNotificationChannelAsync('default', {
      name: channelName,
      importance: Notifications.AndroidImportance.HIGH,
    });
    const current = await Notifications.getPermissionsAsync();
    const granted =
      current.granted ||
      (ask && current.canAskAgain && (await Notifications.requestPermissionsAsync()).granted);
    if (!granted) return;

    const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    unwrap(await api.PUT('/api/v1/users/me/push-tokens', { body: { token, language } }));
    if (generation !== started) {
      // Signed out while the PUT was in flight: take the token straight back (best effort).
      await api.DELETE('/api/v1/users/me/push-tokens', { body: { token } }).catch(() => {});
      return;
    }
    registered = token;
  } catch {
    // No Firebase configuration in this build, offline, or refused: polling carries on.
  }
}

/// After a 401 the server DELETE would fail without auth: only the local state goes.
export function forgetPush() {
  generation++;
  registered = null;
}

/// Before the session ends, while the request can still be authenticated.
export async function unregisterPush() {
  generation++;
  const token = registered;
  registered = null;
  if (!token) return;
  try {
    unwrap(await api.DELETE('/api/v1/users/me/push-tokens', { body: { token } }));
  } catch {
    // The token stays on the server until another account claims the device.
  }
}
