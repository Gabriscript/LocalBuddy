import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, space, type, useColors } from '@/theme';

const BAR_HEIGHT = 64;
const CIRCLE = 56;
const RING = 6;
/// The ring is centred on the capsule's top edge, so half of it stands above the bar (34px, the
/// circle 28px) and the label under it lands on the same line as the side labels.
const RISE = CIRCLE / 2 + RING;
/// Declaration order keeps Discover the initial route; this is only the order on screen.
const VISUAL_ORDER = ['chats', 'discover', 'me'];

/// How far from the bottom of the screen the bar reaches, plus breathing room. Every tab screen
/// pads the end of its scroll by this, because the bar floats over the content.
export function useTabBarClearance() {
  const insets = useSafeAreaInsets();
  return insets.bottom + space.sm + BAR_HEIGHT + RISE + space.md;
}

/// A floating capsule with Discover raised in the middle. The labels and icons come from the
/// `Tabs.Screen` options, so the layout stays the single place that names a destination.
export function TabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const c = useColors();
  const routes = [...state.routes].sort(
    (a, b) => VISUAL_ORDER.indexOf(a.name) - VISUAL_ORDER.indexOf(b.name),
  );

  return (
    // Tall enough to hold the raised circle, or Android drops touches on the part outside it;
    // box-none lets the transparent corners above the capsule reach the content behind.
    <View role="tablist" style={[styles.bar, { bottom: insets.bottom + space.sm }]}>
      <View style={[styles.capsule, { backgroundColor: c.surface, borderColor: c.border }]} />
      {routes.map((route) => {
        const { options } = descriptors[route.key];
        const focused = state.routes[state.index].key === route.key;
        const title = options.title ?? route.name;
        const centre = route.name === 'discover';
        const tint = focused ? c.primary : c.textMuted;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });

        return (
          <Pressable
            key={route.key}
            role="tab"
            aria-selected={focused}
            aria-label={options.tabBarAccessibilityLabel ?? title}
            onPress={onPress}
            onLongPress={onLongPress}
            style={({ pressed }) => [centre ? styles.centre : styles.side, pressed && styles.pressed]}>
            {centre ? (
              <View style={[styles.ring, { backgroundColor: c.background }]}>
                <View
                  style={[
                    styles.circle,
                    focused
                      ? { backgroundColor: c.primary, borderColor: c.primary }
                      : { backgroundColor: c.surfaceMuted, borderColor: c.border },
                  ]}>
                  {options.tabBarIcon?.({ focused, color: focused ? c.onPrimary : c.text, size: 28 })}
                </View>
              </View>
            ) : (
              <View>
                {options.tabBarIcon?.({ focused, color: tint, size: 24 })}
                {options.tabBarBadge !== undefined ? (
                  <View aria-hidden style={[styles.badge, { backgroundColor: c.primary, borderColor: c.surface }]}>
                    <Text style={[type.caption, styles.badgeText, { color: c.onPrimary }]}>
                      {options.tabBarBadge}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
            <Text style={[type.label, { color: tint }]} numberOfLines={1}>
              {title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: space.md,
    right: space.md,
    height: RISE + BAR_HEIGHT,
    flexDirection: 'row',
    // As a style, not a prop: React Native Web 0.21 deprecates the prop.
    pointerEvents: 'box-none',
  },
  capsule: {
    pointerEvents: 'none',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: BAR_HEIGHT,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  side: {
    flex: 1,
    height: BAR_HEIGHT,
    marginTop: RISE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centre: { flex: 1, alignItems: 'center' },
  ring: {
    width: CIRCLE + RING * 2,
    height: CIRCLE + RING * 2,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // On the icon's top-right corner, clear of the label underneath. The ring in the bar's own
  // colour keeps it apart from the icon, which is coral too while Chats is the active tab.
  badge: {
    position: 'absolute',
    top: -8,
    left: 12,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderWidth: 2,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 11, lineHeight: 14, fontVariant: ['tabular-nums'] },
  pressed: { opacity: 0.75 },
});
