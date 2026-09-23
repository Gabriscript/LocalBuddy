import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { radius, space, type, useColors } from '@/theme';

import { AuthedImage } from './AuthedImage';

// Room for a label under each satellite without it running under the photo in the middle.
const STAGE = 320;
const ORBIT = 120;
const SATELLITE = 60;
const PLANET = 88;

/// Where each satellite sits on the circle, starting at the top and going clockwise.
function pointOnCircle(index: number, total: number, r: number) {
  const theta = (2 * Math.PI * index) / total - Math.PI / 2;
  return { x: r * Math.cos(theta), y: r * Math.sin(theta) };
}

/// The one moment in the app allowed to celebrate: two people chose each other, and until now
/// the app simply navigated. The three things you can do next come out of the centre like
/// satellites and wind back in when the moment is dismissed.
///
/// It is a dialog, not decoration: it has a name, the actions are buttons with labels that are
/// always visible (a phone has no hover), and it collapses to a plain appearance when the
/// system asks for less movement.
export function MatchBurst({
  name,
  photoPath,
  onSayHello,
  onSeeProfile,
  onClose,
}: {
  name: string;
  photoPath?: string | null;
  onSayHello: () => void;
  /// Left out where the profile is already on screen behind the burst.
  onSeeProfile?: () => void;
  onClose: () => void;
}) {
  const c = useColors();
  const [progress] = useState(() => new Animated.Value(0));
  const [still, setStill] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setStill);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setStill);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (still) {
      progress.setValue(1);
      return;
    }
    const animation = Animated.spring(progress, {
      toValue: 1,
      useNativeDriver: true,
      damping: 11,
      stiffness: 140,
      mass: 0.9,
    });
    animation.start();
    return () => animation.stop();
  }, [still, progress]);

  /// Everything leaves the way it arrived, and only then does the caller get its turn.
  const leave = (then: () => void) => {
    if (still) {
      then();
      return;
    }
    Animated.timing(progress, {
      toValue: 0,
      duration: 420,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => finished && then());
  };

  const actions = [
    { icon: 'chatbubble-outline' as const, label: 'Say hello', onPress: onSayHello },
    ...(onSeeProfile
      ? [{ icon: 'person-outline' as const, label: 'Their profile', onPress: onSeeProfile }]
      : []),
    { icon: 'time-outline' as const, label: 'Later', onPress: onClose },
  ];

  // The ring turns as it opens and unwinds as it closes; each satellite turns the other way, so
  // the labels stay upright while the whole thing spirals.
  const spin = progress.interpolate({ inputRange: [0, 1], outputRange: ['-120deg', '0deg'] });
  const counterSpin = progress.interpolate({ inputRange: [0, 1], outputRange: ['120deg', '0deg'] });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => leave(onClose)}>
      <View
        role="dialog"
        aria-modal
        aria-label={`You and ${name} both said yes`}
        style={[styles.backdrop, { backgroundColor: c.scrimStrong }]}>
        <View style={styles.headline}>
          <Text role="heading" style={[type.display, styles.centred, { color: c.onOverlay }]}>
            You both said yes
          </Text>
          <Text style={[type.body, styles.centred, { color: c.onOverlay }]}>
            The chat with {name} is open, and nobody paid for it.
          </Text>
        </View>

        <View style={styles.stage}>
          <Animated.View style={[styles.ring, { transform: [{ rotate: spin }] }]}>
            {actions.map((action, index) => {
              const { x, y } = pointOnCircle(index, actions.length, ORBIT);
              return (
                <Animated.View
                  key={action.label}
                  style={[
                    styles.satellite,
                    {
                      opacity: progress,
                      transform: [
                        {
                          translateX: progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, x],
                          }),
                        },
                        {
                          translateY: progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, y],
                          }),
                        },
                        { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
                        { rotate: counterSpin },
                      ],
                    },
                  ]}>
                  <Pressable
                    onPress={() => leave(action.onPress)}
                    accessibilityRole="button"
                    accessibilityLabel={action.label}
                    style={({ pressed }) => [
                      styles.satelliteButton,
                      { backgroundColor: c.surface, opacity: pressed ? 0.75 : 1 },
                    ]}>
                    <Ionicons name={action.icon} size={24} color={c.text} aria-hidden />
                  </Pressable>
                  <Text style={[type.caption, styles.centred, { color: c.onOverlay }]}>
                    {action.label}
                  </Text>
                </Animated.View>
              );
            })}
          </Animated.View>

          <AuthedImage
            path={photoPath}
            style={[styles.planet, { backgroundColor: c.surfaceMuted, borderColor: c.surface }]}
            accessibilityLabel={`Photo of ${name}`}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xl },
  headline: { gap: space.sm, paddingHorizontal: space.lg, maxWidth: 420 },
  centred: { textAlign: 'center' },
  stage: { width: STAGE, height: STAGE, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  satellite: { position: 'absolute', alignItems: 'center', gap: space.xs, width: 88 },
  satelliteButton: {
    width: SATELLITE,
    height: SATELLITE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planet: { width: PLANET, height: PLANET, borderRadius: radius.pill, borderWidth: 2 },
});
