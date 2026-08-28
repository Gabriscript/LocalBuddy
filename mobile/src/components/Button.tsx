import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, space, type, useColors } from '@/theme';

type Variant = 'primary' | 'secondary' | 'quiet';

/// One button, three weights. A screen shows at most one `primary`: that is what makes the
/// intended action obvious instead of leaving three equal-looking choices.
export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
}) {
  const c = useColors();
  const off = disabled || loading;

  const background =
    variant === 'primary' ? c.primary : variant === 'secondary' ? c.surfaceMuted : 'transparent';
  const foreground = variant === 'primary' ? c.onPrimary : c.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      android_ripple={{ color: c.border }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: background,
          borderColor: variant === 'quiet' ? 'transparent' : c.border,
          // Opacity, not scale: the bounds stay put, so nothing around the button jumps.
          opacity: off ? 0.45 : pressed ? 0.75 : 1,
        },
      ]}>
      <View style={styles.content}>
        {loading ? <ActivityIndicator size="small" color={foreground} /> : null}
        <Text style={[type.label, { color: foreground, fontSize: 16 }]}>{title}</Text>
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
});
