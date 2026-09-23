import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { components } from '@/api/generated';
import { useMe, useUpdateProfile } from '@/api/hooks';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Field } from '@/components/Field';
import { draftFrom, ProfileFields } from '@/components/ProfileFields';
import { Screen } from '@/components/Screen';
import { space, type, useColors } from '@/theme';

type Me = components['schemas']['MyProfile'];

const ROLES = [
  { value: 'host', label: 'Host' },
  { value: 'guest', label: 'Guest' },
  { value: 'entrambi', label: 'Both' },
];

/// The same answers as onboarding step 3, without the five-step frame, plus the three things
/// the onboarding never asks again: the name, the city, and which role you are here for
/// (GUIDELINES §11.1 says the role can change later, and until now it could not).
export default function EditProfile() {
  const { data: me, isPending, error, refetch } = useMe();
  return (
    <Screen loading={isPending} error={error} onRetry={refetch}>
      {me ? <EditForm me={me} /> : null}
    </Screen>
  );
}

function EditForm({ me }: { me: Me }) {
  const c = useColors();
  const router = useRouter();
  const save = useUpdateProfile();

  const [name, setName] = useState(me.name);
  const [city, setCity] = useState(me.city);
  const [role, setRole] = useState(me.role);
  const [draft, setDraft] = useState(() => draftFrom(me));

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/me'));
  const complete = name.trim() && city.trim() && draft.whatWeWillDo.trim();

  function submit() {
    // PUT replaces the whole profile, so everything on this screen travels in one body.
    save.mutate({ name: name.trim(), city: city.trim(), role, ...draft }, { onSuccess: goBack });
  }

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: c.background }]}>
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          style={styles.iconButton}>
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text role="heading" style={[type.title, { color: c.text }]}>
          Edit profile
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Field
          label="Name"
          value={name}
          onChangeText={setName}
          maxLength={80}
          autoCapitalize="words"
        />
        <Field
          label="City"
          value={city}
          onChangeText={setCity}
          maxLength={80}
          autoCapitalize="words"
        />

        <View style={styles.group}>
          <Text style={[type.label, { color: c.text }]}>I want to be</Text>
          <View style={styles.chips} role="radiogroup" aria-label="I want to be">
            {ROLES.map((option) => (
              <Chip
                key={option.value}
                as="radio"
                label={option.label}
                selected={role === option.value}
                onPress={() => setRole(option.value)}
              />
            ))}
          </View>
        </View>

        <ProfileFields draft={draft} onChange={setDraft} hosts={role !== 'guest'} />

        {save.error ? (
          <Text accessibilityRole="alert" style={[type.body, { color: c.danger }]}>
            {save.error.message}
          </Text>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: c.border }]}>
        <Button
          title="Save changes"
          loading={save.isPending}
          disabled={!complete}
          onPress={submit}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingRight: space.md,
    paddingBottom: space.sm,
  },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  body: { padding: space.md, paddingBottom: space.xxl, gap: space.lg },
  group: { gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  footer: { padding: space.md, borderTopWidth: StyleSheet.hairlineWidth },
});
