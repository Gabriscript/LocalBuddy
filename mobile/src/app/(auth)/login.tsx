import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { useAuth } from '@/lib/auth';
import { space, type, useColors } from '@/theme';

export default function Login() {
  const c = useColors();
  const { signIn } = useAuth();
  const router = useRouter();
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
      // the server's own wording already says what to do next.
      setError(e instanceof ApiError ? e.message : 'Could not sign in. Check your connection.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.form}>
        <View style={styles.brand}>
          <Text style={[type.display, { color: c.text }]}>LocalBuddy</Text>
          <Text style={[type.body, { color: c.textMuted }]}>Meet locals. Share cultures.</Text>
        </View>

        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          autoCorrect={false}
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
          autoComplete="current-password"
          error={error}
        />

        <Button
          title="Sign in"
          onPress={submit}
          loading={busy}
          disabled={!email || !password}
        />
        <Link href="/register" style={[type.label, styles.link, { color: c.text }]}>
          No account yet? Register
        </Link>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  form: { flex: 1, justifyContent: 'center', gap: space.md, padding: space.lg },
  brand: { gap: space.xs, marginBottom: space.md },
  link: { textAlign: 'center', paddingVertical: space.md },
});
