import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, space, useColors } from '@/theme';

/// Blocks shaped like the content that is coming, instead of a spinner in the middle of an
/// empty screen. The layout is already in place, so nothing jumps when the data lands.

/// One pulse drives every block on a screen, and no pulse at all for a reader who asked the
/// system for less movement.
function usePulse() {
  const [opacity] = useState(() => new Animated.Value(0.65));
  const [still, setStill] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setStill);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setStill);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (still) {
      opacity.setValue(0.85);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.65, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [still, opacity]);

  return opacity;
}

function Block({ opacity, style }: { opacity: Animated.Value; style: StyleProp<ViewStyle> }) {
  const c = useColors();
  return (
    <Animated.View
      aria-hidden
      style={[{ backgroundColor: c.surfaceMuted, borderRadius: radius.sm, opacity }, style]}
    />
  );
}

/// The discovery feed: the same card geometry, down to the 4:3 photo.
export function FeedSkeleton() {
  const c = useColors();
  const opacity = usePulse();

  return (
    <View style={styles.feed} role="progressbar" aria-label="Loading profiles">
      {[0, 1].map((card) => (
        <View key={card} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Block opacity={opacity} style={styles.photo} />
          <View style={styles.cardBody}>
            <Block opacity={opacity} style={styles.name} />
            <Block opacity={opacity} style={styles.line} />
            <Block opacity={opacity} style={styles.lineWide} />
          </View>
        </View>
      ))}
    </View>
  );
}

/// The conversation list: a face and two lines, in the geometry the real row uses, down to the
/// 48pt avatar and the 72pt height. A skeleton of a different shape is just a different jump.
export function ChatListSkeleton() {
  const c = useColors();
  const opacity = usePulse();

  return (
    <View role="progressbar" aria-label="Loading conversations">
      {[0, 1, 2, 3, 4].map((row) => (
        <View key={row} style={[styles.row, { borderBottomColor: c.border }]}>
          <Block opacity={opacity} style={styles.avatar} />
          <View style={styles.rowText}>
            <Block opacity={opacity} style={styles.line} />
            <Block opacity={opacity} style={styles.lineWide} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  feed: { paddingHorizontal: space.md, paddingTop: space.md, gap: space.lg },
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: 0 },
  cardBody: { padding: space.md, gap: space.sm },
  name: { height: 24, width: '45%' },
  line: { height: 14, width: '30%' },
  lineWide: { height: 14, width: '80%' },
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: { width: 48, height: 48, borderRadius: radius.pill },
  rowText: { flex: 1, gap: space.sm },
});
