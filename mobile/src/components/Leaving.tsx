import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing } from 'react-native';

import { useReducedMotion } from '@/lib/motion';

/// A list row that folds away the moment it has been answered, instead of sitting there until
/// the server confirms and then vanishing. The row keeps its place in the data: only its height
/// and opacity go, so the list closes over it smoothly and reopens if the answer is refused.
export function Leaving({ leaving, children }: { leaving: boolean; children: ReactNode }) {
  const still = useReducedMotion();
  // 1 is fully there, 0 is gone.
  const [progress] = useState(() => new Animated.Value(1));
  // Measured while the row is whole, because a height can only be animated between numbers.
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (still) {
      progress.setValue(leaving ? 0 : 1);
      return;
    }
    const fold = Animated.timing(progress, {
      toValue: leaving ? 0 : 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      // Height is layout, which the native driver cannot animate.
      useNativeDriver: false,
    });
    fold.start();
    return () => fold.stop();
  }, [leaving, still, progress]);

  return (
    <Animated.View
      // Gone for a screen reader and for a finger as soon as it starts to leave.
      aria-hidden={leaving}
      onLayout={(event) => {
        if (!leaving) setHeight(event.nativeEvent.layout.height);
      }}
      style={
        leaving
          ? {
              height: progress.interpolate({ inputRange: [0, 1], outputRange: [0, height] }),
              opacity: progress,
              overflow: 'hidden',
              pointerEvents: 'none',
            }
          : undefined
      }>
      {children}
    </Animated.View>
  );
}
