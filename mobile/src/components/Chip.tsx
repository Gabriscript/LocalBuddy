import { Pressable, StyleSheet, Text } from 'react-native';

import { radius, space, type, useColors } from '@/theme';

/// A choice you can see all of at once. Selection is a tonal inversion, never the accent:
/// ink stays with the primary action of the screen (DESIGN.md).
export function Chip({
  label,
  selected,
  onPress,
  as,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  /// `radio` for one choice out of a group, `checkbox` for any number of them. A plain button
  /// that only changes colour says nothing to a screen reader.
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
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
