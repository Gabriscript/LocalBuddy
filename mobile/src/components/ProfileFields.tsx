import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/generated';
import { space, type, useColors } from '@/theme';

import { Field } from './Field';
import { Toggle } from './Toggle';

type Me = components['schemas']['MyProfile'];

/// What a member writes about themselves. Two screens ask for exactly this: step 3 of the
/// onboarding and the edit screen behind the Me tab. One form, two frames around it.
export type ProfileDraft = {
  whatWeWillDo: string;
  whyIHost: string;
  languagesSpoken: string;
  hasCar: boolean;
  smokes: boolean;
  hasPets: boolean;
  profileVisibleToAnonymous: boolean;
};

export function draftFrom(me: Me): ProfileDraft {
  return {
    whatWeWillDo: me.whatWeWillDo,
    whyIHost: me.whyIHost,
    languagesSpoken: me.languagesSpoken,
    hasCar: me.hasCar,
    smokes: me.smokes,
    hasPets: me.hasPets,
    profileVisibleToAnonymous: me.profileVisibleToAnonymous,
  };
}

export function ProfileFields({
  draft,
  onChange,
  hosts,
}: {
  draft: ProfileDraft;
  onChange: (next: ProfileDraft) => void;
  /// Guests are never asked why they host.
  hosts: boolean;
}) {
  const c = useColors();
  const set =
    <K extends keyof ProfileDraft>(key: K) =>
    (value: ProfileDraft[K]) =>
      onChange({ ...draft, [key]: value });

  return (
    <>
      <Field
        label="What would we do together?"
        hint="A walk through your neighbourhood, a market you love, the bar only locals know."
        value={draft.whatWeWillDo}
        onChangeText={set('whatWeWillDo')}
        multiline
        maxLength={500}
        autoCapitalize="sentences"
      />
      {hosts ? (
        <Field
          label="Why do you host?"
          value={draft.whyIHost}
          onChangeText={set('whyIHost')}
          multiline
          maxLength={500}
          autoCapitalize="sentences"
        />
      ) : null}
      <Field
        label="Languages you speak"
        hint="For example: Italian, English, a little Spanish."
        value={draft.languagesSpoken}
        onChangeText={set('languagesSpoken')}
        maxLength={120}
        autoCapitalize="sentences"
      />

      <View style={styles.group}>
        <Text style={[type.label, { color: c.textMuted }]}>A few facts</Text>
        <Toggle label="I have a car" value={draft.hasCar} onChange={set('hasCar')} />
        <Toggle label="I smoke" value={draft.smokes} onChange={set('smokes')} />
        <Toggle label="I have pets" value={draft.hasPets} onChange={set('hasPets')} />
      </View>

      <Toggle
        label="Visible to people without an account"
        hint="Off: only LocalBuddy members can see your profile. You can change this at any time."
        value={draft.profileVisibleToAnonymous}
        onChange={set('profileVisibleToAnonymous')}
      />
    </>
  );
}

const styles = StyleSheet.create({
  group: { gap: space.sm },
});
