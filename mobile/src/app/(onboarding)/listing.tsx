import { useRouter } from 'expo-router';

import { StepPage } from '@/components/StepPage';

/// Step 5, hosts only: PUT /api/v1/listings/me. Overnight cannot be switched on without the
/// TULPS / Alloggiati Web acknowledgement — the backend refuses it, and so must this screen.
export default function Listing() {
  const router = useRouter();
  // TODO: offersExperience / offersOvernight toggles + overnightComplianceAck checkbox
  return (
    <StepPage
      step={5}
      title="What you offer"
      subtitle="An afternoon out, a place to stay, or both."
      cta="Finish"
      onNext={() => router.replace('/discover')}
    />
  );
}
