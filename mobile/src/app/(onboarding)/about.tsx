import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/generated';
import { useMe, useUpdateProfile } from '@/api/hooks';
import { Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { StepPage } from '@/components/StepPage';
import { Toggle } from '@/components/Toggle';
import { space, type, useColors } from '@/theme';

type Me = components['schemas']['MyProfile'];

/// Step 3: the guided prompts, the three traits and who may read the profile.
/// PUT /api/v1/users/me — which replaces the whole profile, so name, city and role are sent
/// back unchanged from what the server already has.
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
  const [form, setForm] = useState({
    whatWeWillDo: me.whatWeWillDo,
    whyIHost: me.whyIHost,
    languagesSpoken: me.languagesSpoken,
    hasCar: me.hasCar,
    smokes: me.smokes,
    hasPets: me.hasPets,
    profileVisibleToAnonymous: me.profileVisibleToAnonymous,
  });
  const set = <K extends keyof typeof form>(key: K) => (value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function submit() {
    save.mutate(
      { name: me.name, city: me.city, role: me.role, ...form },
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
      disabled={!form.whatWeWillDo.trim()}
      onNext={submit}>
      <Field
        label="What would we do together?"
        hint="A walk through your neighbourhood, a market you love, the bar only locals know."
        value={form.whatWeWillDo}
        onChangeText={set('whatWeWillDo')}
        multiline
        maxLength={500}
        autoCapitalize="sentences"
      />
      {hosts ? (
        <Field
          label="Why do you host?"
          value={form.whyIHost}
          onChangeText={set('whyIHost')}
          multiline
          maxLength={500}
          autoCapitalize="sentences"
        />
      ) : null}
      <Field
        label="Languages you speak"
        hint="For example: Italian, English, a little Spanish."
        value={form.languagesSpoken}
        onChangeText={set('languagesSpoken')}
        maxLength={120}
        autoCapitalize="sentences"
      />

      <View style={styles.group}>
        <Text style={[type.label, { color: c.textMuted }]}>A few facts</Text>
        <Toggle label="I have a car" value={form.hasCar} onChange={set('hasCar')} />
        <Toggle label="I smoke" value={form.smokes} onChange={set('smokes')} />
        <Toggle label="I have pets" value={form.hasPets} onChange={set('hasPets')} />
      </View>

      <Toggle
        label="Visible to people without an account"
        hint="Off: only LocalBuddy members can see your profile. You can change this at any time."
        value={form.profileVisibleToAnonymous}
        onChange={set('profileVisibleToAnonymous')}
      />

      {save.error ? (
        <Text accessibilityRole="alert" style={[type.body, { color: c.danger }]}>
          {save.error.message}
        </Text>
      ) : null}
    </StepPage>
  );
}

const styles = StyleSheet.create({
  group: { gap: space.sm },
});
