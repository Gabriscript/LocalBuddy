import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { DiscoveryFilters } from '@/api/hooks';
import { TIMES_OF_DAY } from '@/api/labels';
import { radius, space, type, useColors } from '@/theme';

import { Button } from './Button';
import { Field } from './Field';
import { Toggle } from './Toggle';

/// Everything the discovery feed can be narrowed by, except the role, which stays in the
/// chips on the screen itself: it is the one filter worth a single tap.
///
/// Mounted only while open, so the draft always starts from what the feed is actually
/// showing. The cost is no slide-out animation on close, which nobody waits for.
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
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(value);

  const set =
    <K extends keyof DiscoveryFilters>(key: K) =>
    (next: DiscoveryFilters[K]) =>
      setDraft((f) => ({ ...f, [key]: next }));

  const times = draft.timeOfDay ?? [];
  const toggleTime = (time: number) =>
    set('timeOfDay')(times.includes(time) ? times.filter((t) => t !== time) : [...times, time]);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      {/* Tapping beside the sheet closes it, the way a sheet does. Hidden from screen
          readers, which have the Close button instead. */}
      <Pressable aria-hidden style={styles.backdrop} onPress={onClose} />

      <View
        role="dialog"
        aria-modal
        aria-label="Filters"
        style={[styles.sheet, { backgroundColor: c.background }]}>
        <View style={styles.header}>
          <Text role="heading" style={[type.title, { color: c.text }]}>
            Filters
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close filters"
            hitSlop={8}
            style={styles.close}>
            <Ionicons name="close" size={24} color={c.text} aria-hidden />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
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
        </ScrollView>

        <View
          style={[styles.footer, { borderTopColor: c.border, paddingBottom: insets.bottom + space.md }]}>
          <View style={styles.footerItem}>
            <Button title="Clear" variant="quiet" onPress={() => setDraft({})} />
          </View>
          <View style={styles.footerItem}>
            <Button title="Show results" onPress={() => onApply(draft)} />
          </View>
        </View>
      </View>
    </Modal>
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
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '85%',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: space.md,
    paddingRight: space.xs,
    paddingTop: space.md,
  },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  body: { padding: space.md, gap: space.lg },
  group: { gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  footer: {
    flexDirection: 'row',
    gap: space.sm,
    padding: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerItem: { flex: 1 },
});
