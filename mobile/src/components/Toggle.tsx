import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, space, type, useColors } from '@/theme';

/// A labelled on/off choice. The whole row is the control — one large target, announced once
/// with its label — rather than a small switch beside text that does nothing when tapped.
/// `checkbox` is for an explicit acknowledgement, where a switch would read as a preference.
export function Toggle({
  label,
  hint,
  value,
  onChange,
  as = 'switch',
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (next: boolean) => void;
  as?: 'switch' | 'checkbox';
}) {
  const c = useColors();

  return (
    <Pressable
      onPress={() => onChange(!value)}
      // role / aria-* rather than accessibilityRole / accessibilityState: React Native maps
      // these on iOS, Android and the web, where the older props never reach the DOM.
      role={as}
      aria-checked={value}
      aria-label={label}
      accessibilityHint={hint}
      style={({ pressed }) => [styles.row, { backgroundColor: c.surfaceMuted, opacity: pressed ? 0.75 : 1 }]}>
      {as === 'checkbox' ? (
        <Ionicons
          name={value ? 'checkbox' : 'square-outline'}
          size={24}
          color={value ? c.primary : c.textMuted}
          aria-hidden
        />
      ) : null}

      <View style={styles.text}>
        <Text style={[type.label, { color: c.text }]}>{label}</Text>
        {hint ? <Text style={[type.caption, { color: c.textMuted }]}>{hint}</Text> : null}
      </View>

      {as === 'switch' ? (
        // Drawn, not a native Switch: it only shows the state, the row handles the tap, and a
        // real Switch inside it would be a second control for assistive tech (and on the web
        // would take the tap too and flip the value twice).
        <View aria-hidden style={[styles.track, { backgroundColor: value ? c.primary : c.border }]}>
          <View
            style={[
              styles.thumb,
              // Muted when off, so the off state still reads on a dark surface.
              { backgroundColor: value ? c.onPrimary : c.textMuted, alignSelf: value ? 'flex-end' : 'flex-start' },
            ]}
          />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 56,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 4,
    borderRadius: radius.md,
  },
  text: { flex: 1, gap: 2 },
  track: { width: 44, height: 26, padding: 3, borderRadius: radius.pill },
  thumb: { width: 20, height: 20, borderRadius: radius.pill },
});
