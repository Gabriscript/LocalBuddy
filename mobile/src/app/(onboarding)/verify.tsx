import { useRouter } from 'expo-router';
import { Text } from 'react-native';

import { useMe, useVerify } from '@/api/hooks';
import { StepPage } from '@/components/StepPage';
import { type, useColors } from '@/theme';

/// Step 2: identity and 18+ check through the external provider, then POST users/me/verify.
/// The provider SDK is a native module, which is why the app is built as an Expo dev build
/// and not run in Expo Go (ADR-0009). Until Stripe Identity is wired in, only the second half
/// runs, and the Development backend's fake verifier approves every account. Nobody can
/// contact another member without this step (ADR-0007).
export default function Verify() {
  const c = useColors();
  const router = useRouter();
  const verify = useVerify();
  const guest = useMe().data?.role === 'guest';

  return (
    <StepPage
      step={2}
      total={guest ? 4 : 5}
      title="Verify it's you"
      subtitle="A quick document check, once. Nobody can contact another member without it, which is what keeps this a place for meeting strangers safely."
      cta="Start verification"
      loading={verify.isPending}
      onNext={() => verify.mutate(undefined, { onSuccess: () => router.push('/about') })}>
      {verify.error ? (
        // Under 18, or an identity already banned: the backend explains which, in plain words.
        <Text accessibilityRole="alert" style={[type.body, { color: c.danger }]}>
          {verify.error.message}
        </Text>
      ) : null}
    </StepPage>
  );
}
