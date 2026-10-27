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
  band,
  badge,
}: {
  name: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tint: string;
  disabled?: boolean;
  /// For a control on the Night header band: a lighter navy so it still reads as a button.
  band?: boolean;
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
          backgroundColor: band ? c.nightRaised : c.surface,
          borderColor: band ? c.nightRaised : c.border,
          opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
        },
      ]}>
      <Ionicons name={name} size={26} color={tint} />
      {badge ? (
        // Text on Paper, like a selected chip: a count is state, not the accent. On the band,
        // Night on Paper, so the count still stands out from the navy around it.
        <View aria-hidden style={[styles.badge, { backgroundColor: band ? c.onNight : c.text }]}>
          <Text style={[type.caption, styles.badgeText, { color: band ? c.night : c.background }]}>
            {badge}
          </Text>
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
