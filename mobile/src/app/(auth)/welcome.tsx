import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Lockup } from '@/components/Lockup';
import { SceneSheet } from '@/components/SceneSheet';
import { useStrings } from '@/i18n';
import { radius, space, type, useColors } from '@/theme';

/// What somebody with an invitation and no account sees first. A sign-in form says nothing
/// about what this is, and made creating an account the least visible thing on the screen:
/// here the promise comes first, then how it works in three lines, then the two ways in with
/// the one a newcomer needs as the primary action.
export default function Welcome() {
  const c = useColors();
  const router = useRouter();
  const s = useStrings();

  return (
    // The three people sit at about 55% of the photo's height; the barman behind them is above.
    <SceneSheet image={require('../../../assets/images/scenes/s03-bar-counter.jpg')} focus={{ y: 0.55, ratio: 1080 / 1907 }}>
      <View style={styles.brand}>
        <Lockup />
        <Text style={[type.title, { color: c.text }]}>{s.auth.tagline}</Text>
      </View>

      <View role="list" style={styles.steps}>
        {s.auth.how.map((line, index) => (
          <View key={line} role="listitem" style={styles.step}>
            {/* The number is drawn; the order is already the order of the list. */}
            <View aria-hidden style={[styles.number, { backgroundColor: c.surfaceMuted, borderColor: c.border }]}>
              <Text style={[type.label, { color: c.text }]}>{index + 1}</Text>
            </View>
            <Text style={[type.body, styles.line, { color: c.text }]}>{line}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button title={s.auth.createAccount} onPress={() => router.push('/register')} />
        <Button title={s.auth.haveAccountShort} variant="quiet" onPress={() => router.push('/login')} />
      </View>
    </SceneSheet>
  );
}

const styles = StyleSheet.create({
  brand: { gap: space.xs },
  steps: { gap: space.sm + 4 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm + 4 },
  number: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Two points down, so the first line of text sits on the number's own centre line.
  line: { flex: 1, paddingTop: 2 },
  actions: { gap: space.xs, marginTop: space.sm },
});
