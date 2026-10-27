import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useMe } from '@/api/hooks';
import { AuthedImage } from '@/components/AuthedImage';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Pill } from '@/components/Pill';
import { Screen } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { useTabBarClearance } from '@/components/TabBar';
import { TabHeader } from '@/components/TabHeader';
import { LANGUAGE_NAMES, LANGUAGES, useLanguage, useStrings } from '@/i18n';
import { useAuth } from '@/lib/auth';
import { radius, space, type, useColors } from '@/theme';

export default function Me() {
  const c = useColors();
  const clearance = useTabBarClearance();
  const router = useRouter();
  const { data, isPending, error, refetch } = useMe();
  const { signOut } = useAuth();
  const s = useStrings();
  const { preference, phone, setPreference } = useLanguage();
  const [choosingLanguage, setChoosingLanguage] = useState(false);
  const phoneOption = s.language.phone(LANGUAGE_NAMES[phone]);

  return (
    <View style={[styles.page, { backgroundColor: c.background }]}>
      <TabHeader title={s.tabs.me} />
      <Screen loading={isPending} error={error} onRetry={refetch}>
        <ScrollView contentContainerStyle={[styles.body, { paddingBottom: clearance }]}>
          <View style={styles.identity}>
            <AuthedImage
              path={data?.photos?.[0]?.url}
              style={[styles.avatar, { backgroundColor: c.surfaceMuted }]}
              accessibilityLabel={s.common.yourPhoto}
            />
            <View style={styles.identityText}>
              <Text role="heading" style={[type.title, { color: c.text }]}>
                {data?.name}
              </Text>
              <Text style={[type.body, { color: c.textMuted }]}>{data?.city}</Text>
            </View>
          </View>

          <View style={styles.pills}>
            <Pill
              icon={data?.identityVerified ? 'shield-checkmark-outline' : 'alert-circle-outline'}
              label={data?.identityVerified ? s.common.verified : s.me.notVerified}
              tone={data?.identityVerified ? 'positive' : 'neutral'}
            />
            <Pill icon="sparkles-outline" label={s.me.credits(Number(data?.creditsBalance ?? 0))} />
          </View>

          {/* The pill above says what is missing; on its own it was a dead end. Nobody can be
              contacted before this is done (ADR-0007), so it belongs above everything else. */}
          {data && !data.identityVerified ? (
            <Button
              title={s.common.verifyIdentity}
              onPress={() => router.push({ pathname: '/verify', params: { from: 'app' } })}
            />
          ) : null}

          <Button
            title={s.me.editProfile}
            variant="secondary"
            onPress={() => router.push('/edit-profile')}
          />
          <Button
            title={s.me.blocked}
            variant="secondary"
            onPress={() => router.push('/blocked')}
          />
          {/* One control whose words carry both the setting and its value, so a screen reader
              hears what is chosen before opening the choice. */}
          <Button
            title={s.me.languageRow(preference ? LANGUAGE_NAMES[preference] : phoneOption)}
            variant="secondary"
            onPress={() => setChoosingLanguage(true)}
          />

          {/* Sign out sits apart from the rest: it is not one more settings row. */}
          <View style={[styles.separated, { borderTopColor: c.border }]}>
            <Button title={s.me.signOut} variant="quiet" onPress={signOut} />
          </View>
        </ScrollView>
      </Screen>

      {/* Stays open after a choice: the whole sheet switches language under the finger, which
          is the confirmation. Each language is named in itself, so it can be found from any. */}
      {choosingLanguage ? (
        <Sheet title={s.me.language} onClose={() => setChoosingLanguage(false)}>
          <View style={styles.chips} role="radiogroup" aria-label={s.me.language}>
            <Chip
              as="radio"
              label={phoneOption}
              selected={preference === null}
              onPress={() => setPreference(null)}
            />
            {LANGUAGES.map((option) => (
              <Chip
                key={option}
                as="radio"
                label={LANGUAGE_NAMES[option]}
                selected={preference === option}
                onPress={() => setPreference(option)}
              />
            ))}
          </View>
        </Sheet>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  body: { padding: space.md, gap: space.lg },
  identity: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatar: { width: 88, height: 88, borderRadius: radius.pill },
  identityText: { flex: 1, gap: space.xs },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  separated: { paddingTop: space.lg, borderTopWidth: StyleSheet.hairlineWidth },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
