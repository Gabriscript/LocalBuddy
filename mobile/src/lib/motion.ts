import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/// True when the system asks for less movement. Anything that moves asks this first, and then
/// appears in its final state instead (DESIGN.md: motion reports state, it never decorates).
export function useReducedMotion() {
  const [still, setStill] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setStill);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setStill);
    return () => subscription.remove();
  }, []);

  return still;
}
