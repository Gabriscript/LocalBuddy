import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/generated';
import { useMe, useUpsertListing } from '@/api/hooks';
import { Screen } from '@/components/Screen';
import { StepPage } from '@/components/StepPage';
import { Toggle } from '@/components/Toggle';
import { radius, space, type, useColors } from '@/theme';

type Me = components['schemas']['MyProfile'];

/// The three obligations of GUIDELINES §5, confirmed together by one explicit checkbox.
const OVERNIGHT_OBLIGATIONS = [
  'I am registered on the Alloggiati Web portal with my local Questura.',
  "I will check each guest's identity document in person on arrival. A remote check-in is not enough.",
  "I will send each guest's details within 24 hours of arrival, or within 6 hours for stays shorter than a day.",
];

/// Step 5, hosts only: PUT /api/v1/listings/me. Overnight cannot be switched on without the
/// TULPS / Alloggiati Web acknowledgement — the backend refuses it, and so must this screen.
export default function Listing() {
  const { data: me, isPending, error, refetch } = useMe();
  return (
    <Screen loading={isPending} error={error} onRetry={refetch}>
      {me ? <ListingForm me={me} /> : null}
    </Screen>
  );
}

function ListingForm({ me }: { me: Me }) {
  const c = useColors();
  const router = useRouter();
  const save = useUpsertListing();
  const [form, setForm] = useState({
    offersExperience: me.listing?.offersExperience ?? true,
    offersOvernight: me.listing?.offersOvernight ?? false,
    overnightComplianceAck: me.listing?.overnightComplianceAck ?? false,
  });
  const set = (key: keyof typeof form) => (value: boolean) => setForm((f) => ({ ...f, [key]: value }));

  const offersSomething = form.offersExperience || form.offersOvernight;
  const needsAck = form.offersOvernight && !form.overnightComplianceAck;

  return (
    <StepPage
      step={5}
      title="What you offer"
      subtitle="An afternoon out, a place to stay, or both. You can change this later."
      cta="Finish"
      loading={save.isPending}
      disabled={!offersSomething || needsAck}
      onNext={() => save.mutate(form, { onSuccess: () => router.replace('/discover') })}>
      <Toggle
        label="An experience"
        hint="Showing someone your city: a walk, a meal, an afternoon."
        value={form.offersExperience}
        onChange={set('offersExperience')}
      />
      <Toggle
        label="A place to stay"
        hint="Hosting someone overnight in your home."
        value={form.offersOvernight}
        onChange={set('offersOvernight')}
      />

      {form.offersOvernight ? (
        <View style={[styles.obligations, { borderColor: c.border }]}>
          <Text style={[type.label, { color: c.text }]}>Hosting overnight comes with legal obligations</Text>
          {OVERNIGHT_OBLIGATIONS.map((line) => (
            <Text key={line} style={[type.body, { color: c.text }]}>
              {'• '}
              {line}
            </Text>
          ))}
          <Text style={[type.caption, { color: c.textMuted }]}>
            LocalBuddy cannot send these details for you: it takes your own Questura login.
          </Text>
          <Toggle
            as="checkbox"
            label="I confirm all three"
            value={form.overnightComplianceAck}
            onChange={set('overnightComplianceAck')}
          />
        </View>
      ) : null}

      {!offersSomething ? (
        <Text style={[type.caption, { color: c.textMuted }]}>Choose at least one to finish.</Text>
      ) : null}
      {save.error ? (
        <Text accessibilityRole="alert" style={[type.body, { color: c.danger }]}>
          {save.error.message}
        </Text>
      ) : null}
    </StepPage>
  );
}

const styles = StyleSheet.create({
  obligations: {
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
