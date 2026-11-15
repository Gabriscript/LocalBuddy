import { Redirect } from 'expo-router';

import { useAuth } from '@/lib/auth';

/// The entry point decides once, after the stored token has been read, where the session
/// belongs. AuthProvider guarantees that read already happened. Nobody signed in means the
/// welcome, not the sign-in form: on a first launch there is no account to sign in to yet.
export default function Index() {
  const { token } = useAuth();
  return <Redirect href={token ? '/discover' : '/welcome'} />;
}
