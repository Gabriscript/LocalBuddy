import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { useAuth } from '@/lib/auth';
import { radius, space, type, useColors } from '@/theme';

const ROLES = [
  { value: 'host', label: 'Host' },
  { value: 'guest', label: 'Guest' },
  { value: 'entrambi', label: 'Both' },
];

/// Step 1 of the five-step onboarding (GUIDELINES §11.1). Everything after this needs a
/// token, so registration hands straight over to the onboarding stack.
export default function Register() {
  const c = useColors();
  const { register } = useAuth();
  const router = useRouter();
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
      setError(e instanceof ApiError ? e.message : 'Could not register. Check your connection.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <View style={styles.intro}>
          <Text style={[type.display, { color: c.text }]}>Create account</Text>
          <Text style={[type.body, { color: c.textMuted }]}>Step 1 of 5</Text>
        </View>

        <Field label="Name" value={form.name} onChangeText={set('name')} autoCapitalize="words" />
        <Field
          label="Email"
          value={form.email}
          onChangeText={set('email')}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          autoCorrect={false}
        />
        <Field label="City" value={form.city} onChangeText={set('city')} autoCapitalize="words" />
        <Field
          label="Password"
          value={form.password}
          onChangeText={set('password')}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          hint="At least 8 characters."
          error={error}
        />

        <View style={styles.group}>
          <Text style={[type.label, { color: c.text }]}>I want to be</Text>
          <View style={styles.roles}>
            {ROLES.map((role) => {
              const active = form.role === role.value;
              return (
                <Pressable
                  key={role.value}
                  onPress={() => set('role')(role.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => [
                    styles.role,
                    {
                      backgroundColor: active ? c.text : c.surfaceMuted,
                      borderColor: active ? c.text : c.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}>
                  <Text style={[type.label, { color: active ? c.background : c.text }]}>{role.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[type.caption, { color: c.textMuted }]}>You can change this later.</Text>
        </View>

        <Button title="Continue" onPress={submit} loading={busy} disabled={!complete} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  form: { gap: space.md, padding: space.lg, paddingBottom: space.xxl },
  intro: { gap: space.xs, marginBottom: space.sm },
  group: { gap: space.sm },
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
