import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, space, type, useColors } from '@/theme';

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger' | 'tinted';

/// One button, three weights. A screen shows at most one `primary`: that is what makes the
/// intended action obvious instead of leaving three equal-looking choices.
export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
  accessibilityLabel,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  /// Drawn before the words and never instead of them: an icon alone is a guess.
  icon?: keyof typeof Ionicons.glyphMap;
  /// For a button that repeats down a list: the words on it plus whose row it is.
  accessibilityLabel?: string;
}) {
  const c = useColors();
  const off = disabled || loading;

  // `danger` is for a confirmation that takes something away, and nothing else: it is the one
  // place red belongs outside a validation error.
  // `tinted` is the screen's primary action where it repeats, once per card: Card with a
  // hairline and a Coral label, so a feed of them never becomes a column of Coral fills.
  const fills: Record<Variant, string> = {
    primary: c.primary,
    danger: c.danger,
    secondary: c.surfaceMuted,
    quiet: 'transparent',
    tinted: c.surface,
  };
  // A solid button that is switched off goes flat and neutral. Fading it instead left the lifted
  // coral as a muddy burgundy with dark text on it in the dark theme.
  const flat = !!disabled && (variant === 'primary' || variant === 'danger');
  const background = flat ? c.surfaceMuted : fills[variant];
  const foreground = flat
    ? c.textMuted
    : variant === 'primary' || variant === 'danger'
      ? c.onPrimary
      : variant === 'tinted'
        ? c.primary
        : c.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      // `disabled` already announces itself; busy needs aria-busy, since accessibilityState
      // never reaches the DOM on the web.
      aria-busy={!!loading}
      android_ripple={{ color: c.border }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: background,
          borderColor: variant === 'quiet' ? 'transparent' : c.border,
          // Opacity, not scale: the bounds stay put, so nothing around the button jumps.
          opacity: flat ? 1 : off ? 0.45 : pressed ? 0.75 : 1,
        },
      ]}>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={foreground} />
        ) : icon ? (
          <Ionicons name={icon} size={20} color={foreground} aria-hidden />
        ) : null}
        <Text style={[type.label, styles.title, { color: foreground }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // 52 clears the 44pt minimum with room for Dynamic Type before anything clips.
  base: {
    minHeight: 52,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  content: { flexDirection: 'row', gap: space.sm, alignItems: 'center', justifyContent: 'center' },
  // Shrinks before it pushes the icon out of a narrow button.
  title: { fontSize: 16, flexShrink: 1 },
});
