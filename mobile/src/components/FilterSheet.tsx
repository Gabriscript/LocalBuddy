import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { DiscoveryFilters } from '@/api/hooks';
import { TIMES_OF_DAY, type TimeOfDay } from '@/api/labels';
import { useStrings } from '@/i18n';
import { space, type, useColors } from '@/theme';

import { Button } from './Button';
import { Chip } from './Chip';
import { Field } from './Field';
import { Sheet } from './Sheet';
import { Toggle } from './Toggle';

/// Everything the discovery feed can be narrowed by, except the role, which stays in the
/// chips on the screen itself: it is the one filter worth a single tap.
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
      <Field
        label={s.common.city}
        placeholder={s.filters.anywhere}
        value={draft.city ?? ''}
        onChangeText={set('city')}
        autoCapitalize="words"
      />

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

const styles = StyleSheet.create({
  group: { gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  footerItem: { flex: 1 },
});
