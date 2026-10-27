import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/generated';
import { useMe, useUpsertListing } from '@/api/hooks';
import { errorMessage, Screen } from '@/components/Screen';
import { StepPage } from '@/components/StepPage';
import { Toggle } from '@/components/Toggle';
import { useStrings } from '@/i18n';
import { radius, space, type, useColors } from '@/theme';

type Me = components['schemas']['MyProfile'];

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
  const s = useStrings();
  const save = useUpsertListing();
  /// The three obligations of GUIDELINES §5, confirmed together by one explicit checkbox.
  const obligations = [
    s.onboarding.obligationRegistered,
    s.onboarding.obligationCheck,
    s.onboarding.obligationSend,
  ];
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
      title={s.onboarding.listingTitle}
      subtitle={s.onboarding.listingSubtitle}
      cta={s.common.finish}
      loading={save.isPending}
      disabled={!offersSomething || needsAck}
      onNext={() => save.mutate(form, { onSuccess: () => router.replace('/discover') })}>
      <Toggle
        label={s.onboarding.experience}
        hint={s.onboarding.experienceHint}
        value={form.offersExperience}
        onChange={set('offersExperience')}
      />
      <Toggle
        label={s.onboarding.overnight}
        hint={s.onboarding.overnightHint}
        value={form.offersOvernight}
        onChange={set('offersOvernight')}
      />

      {form.offersOvernight ? (
        <View style={[styles.obligations, { borderColor: c.border }]}>
          <Text style={[type.label, { color: c.text }]}>{s.onboarding.obligationsTitle}</Text>
          {obligations.map((line) => (
            <Text key={line} style={[type.body, { color: c.text }]}>
              {'• '}
              {line}
            </Text>
          ))}
          <Text style={[type.caption, { color: c.textMuted }]}>
            {s.onboarding.cannotSend}
          </Text>
          <Toggle
            as="checkbox"
            label={s.onboarding.confirmAll}
            value={form.overnightComplianceAck}
            onChange={set('overnightComplianceAck')}
          />
        </View>
      ) : null}

      {!offersSomething ? (
        <Text style={[type.caption, { color: c.textMuted }]}>{s.onboarding.chooseOne}</Text>
      ) : null}
      {save.error ? (
        <Text accessibilityRole="alert" style={[type.body, { color: c.danger }]}>
          {errorMessage(save.error, s)}
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
