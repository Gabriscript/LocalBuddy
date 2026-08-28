import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { radius, space, type, useColors } from '@/theme';

/// A small fact about a member. The icon is decorative — the word next to it carries the
/// meaning, so nothing here depends on colour alone.
export function Pill({
  icon,
  label,
  tone = 'neutral',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone?: 'neutral' | 'positive';
}) {
  const c = useColors();
  const color = tone === 'positive' ? c.success : c.textMuted;

  return (
    <View style={[styles.pill, { backgroundColor: c.surfaceMuted }]}>
      <Ionicons name={icon} size={14} color={color} />
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
