import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const web = Platform.OS === 'web';

/// The session token belongs in the device keychain, which is what expo-secure-store gives
/// us on iOS and Android. It has no web implementation at all, and the web target exists
/// only to preview the UI in a browser — so there it degrades to localStorage. That is not
/// secure storage, and it never runs on a device.
export const tokenStore = {
  get: (key: string): Promise<string | null> =>
    web ? Promise.resolve(localStorage.getItem(key)) : SecureStore.getItemAsync(key),

  set: (key: string, value: string): Promise<void> =>
    web ? Promise.resolve(localStorage.setItem(key, value)) : SecureStore.setItemAsync(key, value),

  remove: (key: string): Promise<void> =>
    web ? Promise.resolve(localStorage.removeItem(key)) : SecureStore.deleteItemAsync(key),
};
