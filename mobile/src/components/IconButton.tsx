import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, type, useColors } from '@/theme';

/// The round decision buttons. Icon-only, so the accessibility label is not optional —
/// without it a screen reader announces nothing at all.
export function IconButton({
  name,
  label,
  onPress,
  tint,
  disabled,
  sunk,
  badge,
}: {
  name: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tint: string;
  disabled?: boolean;
  /// Sunk Paper instead of Card, for a control that sits on the page rather than on a photo.
  sunk?: boolean;
  /// A count drawn on the corner. Visual only: the label has to say it too.
  badge?: number;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      android_ripple={{ color: c.border, borderless: true }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: sunk ? c.surfaceMuted : c.surface,
          borderColor: c.border,
          opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
        },
      ]}>
      <Ionicons name={name} size={26} color={tint} />
      {badge ? (
        // Text on Paper, like a selected chip: a count is state, not the accent.
        <View aria-hidden style={[styles.badge, { backgroundColor: c.text }]}>
          <Text style={[type.caption, styles.badgeText, { color: c.background }]}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 12, lineHeight: 16, fontVariant: ['tabular-nums'] },
});
