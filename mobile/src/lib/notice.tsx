import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { radius, space, type, useColors } from '@/theme';

import { useReducedMotion } from './motion';

export type Notice = {
  title: string;
  body?: string;
  /// The member the notice is about, as a small face on the left.
  photoPath?: string | null;
  /// The one way to take it back, offered while the notice is up.
  action?: { label: string; onPress: () => void };
};

const NoticeContext = createContext<((notice: Notice) => void) | null>(null);

/// Says out loud what a tap just did. A request that leaves with no word is indistinguishable
/// from a button that does nothing: the first time somebody asks to meet, this is the only
/// thing telling them it went, and what happens next.
export function useNotice() {
  const show = useContext(NoticeContext);
  if (!show) throw new Error('useNotice must be used inside <NoticeProvider>');
  return show;
}

/// How long a notice stays: long enough to read two short lines, longer when it carries the
/// only way to undo something.
const STAY = 5_000;
const STAY_WITH_ACTION = 8_000;

export function NoticeProvider({ children }: { children: ReactNode }) {
  // The key restarts the timer and the entrance when a second notice replaces the first.
  const [current, setCurrent] = useState<(Notice & { key: number }) | null>(null);
  const show = useCallback((notice: Notice) => setCurrent({ ...notice, key: Date.now() }), []);

  return (
    <NoticeContext.Provider value={show}>
      {children}
      {current ? <NoticeCard key={current.key} notice={current} onGone={() => setCurrent(null)} /> : null}
    </NoticeContext.Provider>
  );
}

/// One card under the status bar, where a phone already puts what just happened. It floats over
/// every screen, so it never has to know about a tab bar, a composer or an action row.
function NoticeCard({ notice, onGone }: { notice: Notice; onGone: () => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const still = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (still) {
      progress.setValue(1);
      return;
    }
    const entrance = Animated.timing(progress, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    entrance.start();
    return () => entrance.stop();
  }, [still, progress]);

  useEffect(() => {
    const timer = setTimeout(() => setLeaving(true), notice.action ? STAY_WITH_ACTION : STAY);
    return () => clearTimeout(timer);
  }, [notice.action]);

  useEffect(() => {
    if (!leaving) return;
    if (still) {
      onGone();
      return;
    }
    const exit = Animated.timing(progress, {
      toValue: 0,
      duration: 140,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    exit.start(({ finished }) => finished && onGone());
    return () => exit.stop();
  }, [leaving, still, progress, onGone]);

  return (
    <View style={[styles.host, { top: insets.top + space.sm }]}>
      <Animated.View
        // Announced when it appears, without taking focus from what the member was doing.
        role="status"
        aria-live="polite"
        style={[
          styles.card,
          { backgroundColor: c.surface, borderColor: c.border },
          {
            opacity: progress,
            transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
          },
        ]}>
        {notice.photoPath ? (
          <Avatar path={notice.photoPath} size={40} photoSize="thumb" aria-hidden style={{ backgroundColor: c.surfaceMuted }} />
        ) : null}

        <View style={styles.text}>
          <Text style={[type.label, { color: c.text }]}>{notice.title}</Text>
          {notice.body ? <Text style={[type.caption, { color: c.textMuted }]}>{notice.body}</Text> : null}
        </View>

        {notice.action ? (
          <Pressable
            onPress={() => {
              notice.action?.onPress();
              setLeaving(true);
            }}
            accessibilityRole="button"
            hitSlop={8}
            style={({ pressed }) => [
              styles.action,
              { backgroundColor: c.surfaceMuted, borderColor: c.border, opacity: pressed ? 0.7 : 1 },
            ]}>
            <Text style={[type.label, { color: c.text }]}>{notice.action.label}</Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // box-none: the strip beside the card still reaches the screen underneath.
  host: {
    position: 'absolute',
    left: space.md,
    right: space.md,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  // Wraps: a short action ("Undo") stays beside the words, a long one drops under them.
  card: {
    width: '100%',
    maxWidth: 480,
    minHeight: 64,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: space.sm + 4,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 4,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: { flexGrow: 1, flexShrink: 1, flexBasis: 160, gap: 2 },
  action: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
