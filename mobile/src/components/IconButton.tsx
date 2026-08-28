import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { radius, useColors } from '@/theme';

/// The round decision buttons. Icon-only, so the accessibility label is not optional —
/// without it a screen reader announces nothing at all.
export function IconButton({
  name,
  label,
  onPress,
  tint,
  disabled,
}: {
  name: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tint: string;
  disabled?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      android_ripple={{ color: c.border, borderless: true }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: c.surface, borderColor: c.border, opacity: disabled ? 0.45 : pressed ? 0.7 : 1 },
      ]}>
      <Ionicons name={name} size={26} color={tint} />
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
});
