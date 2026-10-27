import { useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, space, type, useColors } from '@/theme';

/// The circles: diameter, centre in from the right edge, centre down from the bottom of the
/// status bar. Coral sits on the status bar's lower edge,
/// so what lies under the status icons is coral, never Sky, and Sky shows below it.
const CORAL = { size: 128, right: 28, down: -4 };
const SKY = { size: 88, right: 4, down: 36 };
const SKY_BOTTOM = SKY.down + SKY.size / 2;
/// Room above the title. With the circles placed as above, nothing reaches the title line left
/// of the control column, so a title of any length stays clear of them.
const TOP = 48;
/// The control column on the right. Kept even when empty, so a long title wraps before it
/// reaches the circles instead of running under them.
const ACTION = 56;

/// The Night band at the top of a tab screen: the screen's name in Paper, an optional line in
/// Sky, and one optional control. Two flat circles bleed off the top-right corner; they sit
/// above the control column and right of the title column, never under either.
export function TabHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  // Only while this tab is on screen: a pushed chat or profile is Paper again, and a light
  // status bar left mounted behind it would be white on white.
  const focused = useIsFocused();

  return (
    <View style={[styles.band, { backgroundColor: c.night, paddingTop: insets.top + TOP }]}>
      {focused ? <StatusBar style="light" /> : null}
      <View aria-hidden style={[styles.sky, { top: insets.top + SKY.down - SKY.size / 2, backgroundColor: c.sky }]} />
      <View
        aria-hidden
        style={[styles.coral, { top: insets.top + CORAL.down - CORAL.size / 2, backgroundColor: c.primary }]}
      />

      <View style={styles.text}>
        <Text role="heading" style={[type.display, { color: c.onNight }]}>
          {title}
        </Text>
        {subtitle ? <Text style={[type.body, { color: c.sky }]}>{subtitle}</Text> : null}
      </View>
      {/* Bottom-aligned and never higher than just under Sky, so on a wide screen where the
          subtitle fits on one line the control drops the band a little instead of rising into
          the circles. */}
      <View style={[styles.action, action ? styles.actionClear : null]}>{action}</View>
    </View>
  );
}

const circle = (c: typeof CORAL) =>
  ({ position: 'absolute', width: c.size, height: c.size, right: c.right - c.size / 2, borderRadius: radius.pill, pointerEvents: 'none' }) as const;

const styles = StyleSheet.create({
  band: {
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingBottom: space.lg,
    overflow: 'hidden',
  },
  coral: circle(CORAL),
  sky: circle(SKY),
  text: { flex: 1, gap: space.xs },
  action: { width: ACTION, justifyContent: 'flex-end' },
  actionClear: { paddingTop: SKY_BOTTOM - TOP + space.sm },
});
