import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { SceneSheet } from '@/components/SceneSheet';
import { errorMessage } from '@/components/Screen';
import { useStrings } from '@/i18n';
import { useAuth } from '@/lib/auth';
import { radius, space, type, useColors } from '@/theme';

const ROLES = ['host', 'guest', 'entrambi'] as const;

/// Step 1 of the five-step onboarding (GUIDELINES §11.1). Everything after this needs a
/// token, so registration hands straight over to the onboarding stack.
export default function Register() {
  const c = useColors();
  const { register } = useAuth();
  const router = useRouter();
  const s = useStrings();
  const [form, setForm] = useState({ name: '', email: '', city: '', password: '', role: 'entrambi' });
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const complete = form.name && form.email && form.city && form.password;

  async function submit() {
    setBusy(true);
    setError(undefined);
    try {
      await register(form);
      router.replace('/verify');
    } catch (e) {
      setError(e instanceof ApiError ? errorMessage(e, s) : s.auth.registerFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SceneSheet image={require('../../../assets/images/scenes/s01-wine-window.jpg')}>
      <View style={styles.intro}>
        <Text role="heading" style={[type.display, { color: c.text }]}>
          {s.auth.createAccount}
        </Text>
        <Text style={[type.body, { color: c.textMuted }]}>{s.common.stepOf(1, 5)}</Text>
      </View>

      <Field label={s.common.name} value={form.name} onChangeText={set('name')} autoCapitalize="words" />
      <Field
        label={s.common.email}
        value={form.email}
        onChangeText={set('email')}
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        autoCorrect={false}
      />
      <Field label={s.common.city} value={form.city} onChangeText={set('city')} autoCapitalize="words" />
      <Field
        label={s.common.password}
        value={form.password}
        onChangeText={set('password')}
        secureTextEntry
        textContentType="newPassword"
        autoComplete="new-password"
        hint={s.auth.passwordHint}
        error={error}
      />

      <View style={styles.group}>
        <Text style={[type.label, { color: c.text }]}>{s.common.iWantToBe}</Text>
        <View style={styles.roles} role="radiogroup" aria-label={s.common.iWantToBe}>
          {ROLES.map((role) => {
            const active = form.role === role;
            return (
              <Pressable
                key={role}
                onPress={() => set('role')(role)}
                role="radio"
                aria-checked={active}
                style={({ pressed }) => [
                  styles.role,
                  {
                    backgroundColor: active ? c.text : c.surfaceMuted,
                    borderColor: active ? c.text : c.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}>
                <Text style={[type.label, { color: active ? c.background : c.text }]}>{s.roles[role]}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[type.caption, { color: c.textMuted }]}>{s.auth.changeLater}</Text>
      </View>

      <Button title={s.common.continue} onPress={submit} loading={busy} disabled={!complete} />
      {/* replace, not push: login already links here, and the two would stack up forever. */}
      <Link href="/login" replace style={[type.label, styles.link, { color: c.text }]}>
        {s.auth.haveAccount}
      </Link>
    </SceneSheet>
  );
}

const styles = StyleSheet.create({
  intro: { gap: space.xs, marginBottom: space.sm },
  group: { gap: space.sm },
  link: { textAlign: 'center', paddingVertical: space.md },
  roles: { flexDirection: 'row', gap: space.sm },
  role: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
