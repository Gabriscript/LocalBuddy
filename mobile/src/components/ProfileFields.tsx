import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/generated';
import { ACTIVITY_STYLES, DAYS, LIFESTYLES, type ActivityStyle, type DayOfWeek, type Lifestyle } from '@/api/labels';
import { useStrings } from '@/i18n';
import { space, type, useColors } from '@/theme';

import { Chip } from './Chip';
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
  usualDays: DayOfWeek[];
  activityStyle: ActivityStyle | null;
  lifestyle: Lifestyle | null;
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
    usualDays: me.usualDays,
    activityStyle: me.activityStyle,
    lifestyle: me.lifestyle,
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
  const toggleDay = (day: DayOfWeek) =>
    set('usualDays')(draft.usualDays.includes(day) ? draft.usualDays.filter((d) => d !== day) : [...draft.usualDays, day]);

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

      <Text style={[type.label, { color: c.textMuted }]}>{s.profileFields.style}</Text>
      {hosts ? (
        <View style={styles.group}>
          <Text style={[type.label, { color: c.text }]}>{s.profileFields.usualDays}</Text>
          <View style={styles.chips}>
            {DAYS.map((day) => (
              <Chip
                key={day}
                as="checkbox"
                label={s.days[day]}
                selected={draft.usualDays.includes(day)}
                onPress={() => toggleDay(day)}
              />
            ))}
          </View>
          <Text style={[type.caption, { color: c.textMuted }]}>{s.profileFields.usualDaysHint}</Text>
        </View>
      ) : null}
      <Lean
        label={s.profileFields.activityStyle}
        options={ACTIVITY_STYLES.map((v) => ({ value: v, label: s.activityStyle[v] }))}
        value={draft.activityStyle}
        onChange={set('activityStyle')}
      />
      <Lean
        label={s.profileFields.lifestyle}
        options={LIFESTYLES.map((v) => ({ value: v, label: s.lifestyle[v] }))}
        value={draft.lifestyle}
        onChange={set('lifestyle')}
      />

      <View style={styles.group}>
        <Text style={[type.label, { color: c.textMuted }]}>{s.profileFields.facts}</Text>
        <Toggle
          label={s.profileFields.haveCar}
          hint={draft.hasCar ? s.profileFields.liftHint : undefined}
          value={draft.hasCar}
          onChange={set('hasCar')}
        />
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

/// One side or the other, or "a bit of both", which is null and the default: nobody has to pick.
function Lean<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (next: T | null) => void;
}) {
  const c = useColors();
  const s = useStrings();
  return (
    <View style={styles.group}>
      <Text style={[type.label, { color: c.text }]}>{label}</Text>
      <View style={styles.chips} role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <Chip key={o.value} as="radio" label={o.label} selected={value === o.value} onPress={() => onChange(o.value)} />
        ))}
        <Chip as="radio" label={s.profileFields.both} selected={value === null} onPress={() => onChange(null)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
