import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { DiscoveryFilters } from '@/api/hooks';
import { ACTIVITY_STYLES, DAYS, LIFESTYLES, TIMES_OF_DAY, type DayOfWeek, type TimeOfDay } from '@/api/labels';
import { useStrings } from '@/i18n';
import { space, type, useColors } from '@/theme';

import { Button } from './Button';
import { Chip } from './Chip';
import { Sheet } from './Sheet';
import { Toggle } from './Toggle';

/// Everything the discovery feed can be narrowed by, except the role and the city, which stay
/// on the screen itself: they are the two filters worth a single tap.
export function FilterSheet({
  value,
  onClose,
  onApply,
}: {
  value: DiscoveryFilters;
  onClose: () => void;
  onApply: (next: DiscoveryFilters) => void;
}) {
  const c = useColors();
  const s = useStrings();
  const [draft, setDraft] = useState(value);

  const set =
    <K extends keyof DiscoveryFilters>(key: K) =>
    (next: DiscoveryFilters[K]) =>
      setDraft((f) => ({ ...f, [key]: next }));

  const times = draft.timeOfDay ?? [];
  const toggleTime = (time: TimeOfDay) =>
    set('timeOfDay')(times.includes(time) ? times.filter((t) => t !== time) : [...times, time]);
  const days = draft.days ?? [];
  const toggleDay = (day: DayOfWeek) =>
    set('days')(days.includes(day) ? days.filter((d) => d !== day) : [...days, day]);

  return (
    <Sheet
      title={s.filters.title}
      onClose={onClose}
      footer={
        <>
          <View style={styles.footerItem}>
            <Button title={s.filters.clear} variant="quiet" onPress={() => setDraft({})} />
          </View>
          <View style={styles.footerItem}>
            <Button title={s.filters.showResults} onPress={() => onApply(draft)} />
          </View>
        </>
      }>
      <View style={styles.group}>
        <Text style={[type.label, { color: c.text }]}>{s.filters.whenFree}</Text>
        <View style={styles.chips}>
          {TIMES_OF_DAY.map((time) => (
            <Chip
              key={time}
              as="checkbox"
              label={s.timeOfDay[time]}
              selected={times.includes(time)}
              onPress={() => toggleTime(time)}
            />
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <Text style={[type.label, { color: c.text }]}>{s.filters.usualDays}</Text>
        <View style={styles.chips}>
          {DAYS.map((day) => (
            <Chip key={day} as="checkbox" label={s.days[day]} selected={days.includes(day)} onPress={() => toggleDay(day)} />
          ))}
        </View>
      </View>

      <OneOf
        label={s.filters.activityStyle}
        options={ACTIVITY_STYLES.map((v) => ({ value: v, label: s.activityStyle[v] }))}
        value={draft.activityStyle ?? undefined}
        onChange={set('activityStyle')}
      />
      <OneOf
        label={s.filters.lifestyle}
        options={LIFESTYLES.map((v) => ({ value: v, label: s.lifestyle[v] }))}
        value={draft.lifestyle ?? undefined}
        onChange={set('lifestyle')}
      />

      <Toggle
        label={s.common.canHostOvernight}
        value={!!draft.offersOvernight}
        // Off means "no preference", not "must not host": false would drop every host.
        onChange={(on) => set('offersOvernight')(on || undefined)}
      />

      <Tri label={s.common.hasCar} value={draft.hasCar} onChange={set('hasCar')} />
      <Tri label={s.common.smokes} value={draft.smokes} onChange={set('smokes')} />
      <Tri label={s.filters.hasPets} value={draft.hasPets} onChange={set('hasPets')} />
    </Sheet>
  );
}

/// Three states, because the API's nullable bool has three. An on/off switch here would
/// quietly drop everyone who has not answered that question.
function Tri({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: boolean;
  onChange: (next?: boolean) => void;
}) {
  const c = useColors();
  const s = useStrings();
  return (
    <View style={styles.group}>
      <Text style={[type.label, { color: c.text }]}>{label}</Text>
      <View style={styles.chips} role="radiogroup" aria-label={label}>
        <Chip as="radio" label={s.filters.any} selected={value === undefined} onPress={() => onChange(undefined)} />
        <Chip as="radio" label={s.filters.yes} selected={value === true} onPress={() => onChange(true)} />
        <Chip as="radio" label={s.filters.no} selected={value === false} onPress={() => onChange(false)} />
      </View>
    </View>
  );
}

/// "Any" or exactly one option: members who said "a bit of both" are only hidden once a side is picked.
function OneOf<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value?: T;
  onChange: (next?: T) => void;
}) {
  const c = useColors();
  const s = useStrings();
  return (
    <View style={styles.group}>
      <Text style={[type.label, { color: c.text }]}>{label}</Text>
      <View style={styles.chips} role="radiogroup" aria-label={label}>
        <Chip as="radio" label={s.filters.any} selected={value === undefined} onPress={() => onChange(undefined)} />
        {options.map((o) => (
          <Chip key={o.value} as="radio" label={o.label} selected={value === o.value} onPress={() => onChange(o.value)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  footerItem: { flex: 1 },
});
