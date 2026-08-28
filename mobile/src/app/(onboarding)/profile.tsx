import { useRouter } from 'expo-router';

import { StepPage } from '@/components/StepPage';

/// Steps 3 and 4: role, guided prompts, photo, availability, traits.
/// PUT /api/v1/users/me + PUT /api/v1/users/me/availability + POST /api/v1/photos.
export default function ProfileSetup() {
  const router = useRouter();
  // TODO: guided prompts (whatWeWillDo, whyIHost, languagesSpoken), photo upload, availability
  return (
    <StepPage
      step={4}
      title="Your profile"
      subtitle="A photo, what you would show someone, and when you are usually free."
      cta="Continue"
      onNext={() => router.push('/listing')}
    />
  );
}
