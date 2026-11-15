import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { radius, space, type, useColors } from '@/theme';

/// A small fact about a member. The icon is decorative — the word next to it carries the
/// meaning, so nothing here depends on colour alone.
export function Pill({
  icon,
  label,
  tone = 'neutral',
  surface,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  /// `positive` is the Verified green and belongs to the identity badge alone; `strong` is
  /// Text, for a fact that changes what you would do today (in town now, free today).
  tone?: 'neutral' | 'positive' | 'strong';
  /// Card with a hairline instead of Sunk Paper, for a pill laid on a photograph: opaque, so
  /// its words keep their contrast whatever the photo is.
  surface?: boolean;
}) {
  const c = useColors();
  const color = tone === 'positive' ? c.success : tone === 'strong' ? c.text : c.textMuted;

  return (
    <View
      style={[
        styles.pill,
        surface
          ? { backgroundColor: c.surface, borderColor: c.border, borderWidth: StyleSheet.hairlineWidth }
          : { backgroundColor: c.surfaceMuted },
      ]}>
      <Ionicons name={icon} size={14} color={color} aria-hidden />
      <Text style={[type.caption, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.sm + 2,
    paddingVertical: space.xs + 2,
    borderRadius: radius.pill,
  },
});
