import { Image, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { space, type, useColors } from '@/theme';

/// The mark beside the wordmark, on the two screens somebody sees before they have an account.
export function Lockup() {
  const c = useColors();
  const scheme = useColorScheme();

  return (
    <View style={styles.lockup}>
      {/* Decorative: the wordmark beside it says the name. Never the Night frame on a dark ground. */}
      <Image
        aria-hidden
        style={styles.mark}
        source={
          scheme === 'dark'
            ? require('../../assets/brand/mark-e/png/mark-dark.png')
            : require('../../assets/brand/mark-e/png/mark.png')
        }
      />
      <Text role="heading" style={[type.display, { color: c.text }]}>
        Local<Text style={{ color: c.primary }}>Buddy</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lockup: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  mark: { width: 40, height: 40 },
});
