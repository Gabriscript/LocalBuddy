import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/lib/auth';
import { useColors } from '@/theme';

/// Onboarding needs an account: the guard lives on the group, not repeated in every step.
export default function OnboardingLayout() {
  const { token } = useAuth();
  const c = useColors();
  if (!token) return <Redirect href="/login" />;

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        // A back arrow and nothing else: each step already carries its own title, and the
        // default header would print the route name ("verify", "about") above it.
        headerTitle: '',
        // The navigator's own theme is light-only; without these the header stays white in
        // dark mode above a dark screen.
        headerStyle: { backgroundColor: c.background },
        headerTintColor: c.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: c.background },
      }}
    />
  );
}
