import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/lib/auth';

/// Onboarding needs an account: the guard lives on the group, not repeated in every step.
export default function OnboardingLayout() {
  const { token } = useAuth();
  if (!token) return <Redirect href="/login" />;
  return <Stack screenOptions={{ headerShown: true }} />;
}
