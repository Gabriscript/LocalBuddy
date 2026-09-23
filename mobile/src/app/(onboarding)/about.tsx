import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import type { components } from '@/api/generated';
import { useMe, useUpdateProfile } from '@/api/hooks';
import { draftFrom, ProfileFields } from '@/components/ProfileFields';
import { Screen } from '@/components/Screen';
import { StepPage } from '@/components/StepPage';
import { type, useColors } from '@/theme';

type Me = components['schemas']['MyProfile'];

/// Step 3: the guided prompts, the three traits and who may read the profile. The same fields
/// appear again behind the Me tab, so they live in ProfileFields and this only frames them.
/// PUT /api/v1/users/me replaces the whole profile, so name, city and role are sent back
/// unchanged from what the server already has.
export default function About() {
  const { data: me, isPending, error, refetch } = useMe();
  return (
    <Screen loading={isPending} error={error} onRetry={refetch}>
      {me ? <AboutForm me={me} /> : null}
    </Screen>
  );
}

function AboutForm({ me }: { me: Me }) {
  const c = useColors();
  const router = useRouter();
  const save = useUpdateProfile();
  const hosts = me.role !== 'guest';

  // Starts from what is saved, so coming back to this step shows it rather than blank fields.
  const [draft, setDraft] = useState(() => draftFrom(me));

  function submit() {
    save.mutate(
      { name: me.name, city: me.city, role: me.role, ...draft },
      { onSuccess: () => router.push('/profile') }
    );
  }

  return (
    <StepPage
      step={3}
      total={hosts ? 5 : 4}
      title="About you"
      subtitle="A few short answers do more than a long bio: they tell a stranger what a day with you looks like."
      cta="Continue"
      loading={save.isPending}
      disabled={!draft.whatWeWillDo.trim()}
      onNext={submit}>
      <ProfileFields draft={draft} onChange={setDraft} hosts={hosts} />

      {save.error ? (
        <Text accessibilityRole="alert" style={[type.body, { color: c.danger }]}>
          {save.error.message}
        </Text>
      ) : null}
    </StepPage>
  );
}
