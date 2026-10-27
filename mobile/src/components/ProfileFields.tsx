import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/generated';
import { useStrings } from '@/i18n';
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
  const s = useStrings();
  const set =
    <K extends keyof ProfileDraft>(key: K) =>
    (value: ProfileDraft[K]) =>
      onChange({ ...draft, [key]: value });

  return (
    <>
      <Field
        label={s.profileFields.whatWeDo}
        hint={s.profileFields.whatWeDoHint}
        value={draft.whatWeWillDo}
        onChangeText={set('whatWeWillDo')}
        multiline
        maxLength={500}
        autoCapitalize="sentences"
      />
      {hosts ? (
        <Field
          label={s.profileFields.whyHost}
          value={draft.whyIHost}
          onChangeText={set('whyIHost')}
          multiline
          maxLength={500}
          autoCapitalize="sentences"
        />
      ) : null}
      <Field
        label={s.profileFields.languages}
        hint={s.profileFields.languagesHint}
        value={draft.languagesSpoken}
        onChangeText={set('languagesSpoken')}
        maxLength={120}
        autoCapitalize="sentences"
      />

      <View style={styles.group}>
        <Text style={[type.label, { color: c.textMuted }]}>{s.profileFields.facts}</Text>
        <Toggle label={s.profileFields.haveCar} value={draft.hasCar} onChange={set('hasCar')} />
        <Toggle label={s.profileFields.smoke} value={draft.smokes} onChange={set('smokes')} />
        <Toggle label={s.profileFields.havePets} value={draft.hasPets} onChange={set('hasPets')} />
      </View>

      <Toggle
        label={s.profileFields.visible}
        hint={s.profileFields.visibleHint}
        value={draft.profileVisibleToAnonymous}
        onChange={set('profileVisibleToAnonymous')}
      />
    </>
  );
}

const styles = StyleSheet.create({
  group: { gap: space.sm },
});
