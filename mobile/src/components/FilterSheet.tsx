import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DiscoveryFilters } from '@/api/hooks';
import { TIMES_OF_DAY } from '@/api/labels';
import { radius, space, type, useColors } from '@/theme';

import { Button } from './Button';
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
  const [draft, setDraft] = useState(value);

  const set =
    <K extends keyof DiscoveryFilters>(key: K) =>
    (next: DiscoveryFilters[K]) =>
      setDraft((f) => ({ ...f, [key]: next }));

  const times = draft.timeOfDay ?? [];
  const toggleTime = (time: number) =>
    set('timeOfDay')(times.includes(time) ? times.filter((t) => t !== time) : [...times, time]);

  return (
    <Sheet
      title="Filters"
      onClose={onClose}
      footer={
        <>
          <View style={styles.footerItem}>
            <Button title="Clear" variant="quiet" onPress={() => setDraft({})} />
          </View>
          <View style={styles.footerItem}>
            <Button title="Show results" onPress={() => onApply(draft)} />
          </View>
        </>
      }>
      <Field
        label="City"
        placeholder="Anywhere"
        value={draft.city ?? ''}
        onChangeText={set('city')}
        autoCapitalize="words"
      />

      <View style={styles.group}>
        <Text style={[type.label, { color: c.text }]}>When they are free</Text>
        <View style={styles.chips}>
          {TIMES_OF_DAY.map((time) => (
            <Chip
              key={time.value}
              as="checkbox"
              label={time.label}
              selected={times.includes(time.value)}
              onPress={() => toggleTime(time.value)}
            />
          ))}
        </View>
      </View>

      <Toggle
        label="Can host overnight"
        value={!!draft.offersOvernight}
        // Off means "no preference", not "must not host": false would drop every host.
        onChange={(on) => set('offersOvernight')(on || undefined)}
      />

      <Tri label="Has a car" value={draft.hasCar} onChange={set('hasCar')} />
      <Tri label="Smokes" value={draft.smokes} onChange={set('smokes')} />
      <Tri label="Has pets" value={draft.hasPets} onChange={set('hasPets')} />
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
  return (
    <View style={styles.group}>
      <Text style={[type.label, { color: c.text }]}>{label}</Text>
      <View style={styles.chips} role="radiogroup" aria-label={label}>
        <Chip as="radio" label="Any" selected={value === undefined} onPress={() => onChange(undefined)} />
        <Chip as="radio" label="Yes" selected={value === true} onPress={() => onChange(true)} />
        <Chip as="radio" label="No" selected={value === false} onPress={() => onChange(false)} />
      </View>
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
  as,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  as: 'radio' | 'checkbox';
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      role={as}
      aria-checked={selected}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? c.text : c.surfaceMuted,
          borderColor: selected ? c.text : c.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      <Text style={[type.label, { color: selected ? c.background : c.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: { gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  footerItem: { flex: 1 },
});
