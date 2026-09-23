import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from 'react-native';

import { useMe, useVerify } from '@/api/hooks';
import { StepPage } from '@/components/StepPage';
import { type, useColors } from '@/theme';

/// Step 2: identity and 18+ check through the external provider, then POST users/me/verify.
/// The provider SDK is a native module, which is why the app is built as an Expo dev build
/// and not run in Expo Go (ADR-0009). Until Stripe Identity is wired in, only the second half
/// runs, and the Development backend's fake verifier approves every account. Nobody can
/// contact another member without this step (ADR-0007).
///
/// It is also where anyone already onboarded is sent when the server refuses an action with
/// `identity_verification_required`, which is what `from=app` means: no progress dots, and
/// finishing returns to what was being attempted rather than walking on into step 3 of a flow
/// this member completed long ago.
export default function Verify() {
  const c = useColors();
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const verify = useVerify();
  const guest = useMe().data?.role === 'guest';
  const onboarding = from !== 'app';

  // Reached by deep link there is no screen behind this one, so back would lead nowhere.
  const done = () =>
    onboarding
      ? router.push('/about')
      : router.canGoBack()
        ? router.back()
        : router.replace('/discover');

  return (
    <StepPage
      step={onboarding ? 2 : undefined}
      total={guest ? 4 : 5}
      title="Verify it's you"
      subtitle="A quick document check, once. Nobody can contact another member without it, which is what keeps this a place for meeting strangers safely."
      cta="Start verification"
      loading={verify.isPending}
      onNext={() => verify.mutate(undefined, { onSuccess: done })}>
      {verify.error ? (
        // Under 18, or an identity already banned: the backend explains which, in plain words.
        <Text accessibilityRole="alert" style={[type.body, { color: c.danger }]}>
          {verify.error.message}
        </Text>
      ) : null}
    </StepPage>
  );
}
