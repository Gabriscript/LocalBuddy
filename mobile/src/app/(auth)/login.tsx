import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { SceneSheet } from '@/components/SceneSheet';
import { errorMessage } from '@/components/Screen';
import { useStrings } from '@/i18n';
import { useAuth } from '@/lib/auth';
import { space, type, useColors } from '@/theme';

export default function Login() {
  const c = useColors();
  const { signIn } = useAuth();
  const router = useRouter();
  const s = useStrings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(undefined);
    try {
      await signIn({ email, password });
      router.replace('/discover');
    } catch (e) {
      // invalid_credentials and account_banned are the two codes this endpoint returns, and
      // each one's wording already says what to do next.
      setError(e instanceof ApiError ? errorMessage(e, s) : s.auth.signInFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    // The three people sit at about 55% of the photo's height; the barman behind them is above.
    <SceneSheet image={require('../../../assets/images/scenes/s03-bar-counter.jpg')} focus={{ y: 0.55, ratio: 1080 / 1907 }}>
      <View style={styles.brand}>
        <Text role="heading" style={[type.display, { color: c.text }]}>
          Local<Text style={{ color: c.primary }}>Buddy</Text>
        </Text>
        <Text style={[type.body, { color: c.textMuted }]}>{s.auth.tagline}</Text>
      </View>

      <Field
        label={s.common.email}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        autoCorrect={false}
      />
      <Field
        label={s.common.password}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textContentType="password"
        autoComplete="current-password"
        error={error}
      />

      <Button
        title={s.auth.signIn}
        onPress={submit}
        loading={busy}
        disabled={!email || !password}
      />
      <Link href="/register" style={[type.label, styles.link, { color: c.text }]}>
        {s.auth.noAccount}
      </Link>
    </SceneSheet>
  );
}

const styles = StyleSheet.create({
  brand: { gap: space.xs, marginBottom: space.sm },
  link: { textAlign: 'center', paddingVertical: space.md },
});
