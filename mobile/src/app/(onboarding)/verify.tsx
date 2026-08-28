import { useRouter } from 'expo-router';

import { StepPage } from '@/components/StepPage';

/// Step 2: identity and 18+ check through the external provider, then POST users/me/verify.
/// The provider SDK is a native module, which is why the app is built as an Expo dev build
/// and not run in Expo Go (ADR-0009).
export default function Verify() {
  const router = useRouter();
  // TODO: Stripe Identity session, then POST /api/v1/users/me/verify
  return (
    <StepPage
      step={2}
      title="Verify it's you"
      subtitle="A quick document check, once. Nobody can contact another member without it, which is what keeps this a place for meeting strangers safely (ADR-0007)."
      cta="Start verification"
      onNext={() => router.push('/profile')}
    />
  );
}
