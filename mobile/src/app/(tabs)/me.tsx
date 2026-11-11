import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useMe } from '@/api/hooks';
import { Avatar } from '@/components/Avatar';
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
            <Avatar
              path={data?.photos?.[0]?.url}
              size={88}
              photoSize="medium"
              style={{ backgroundColor: c.surfaceMuted }}
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

          <View style={[styles.rows, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Row icon="create-outline" label={s.me.editProfile} onPress={() => router.push('/edit-profile')} />
            <Row icon="hand-left-outline" label={s.me.blocked} onPress={() => router.push('/blocked')} />
            {/* One control whose words carry both the setting and its value, so a screen reader
                hears what is chosen before opening the choice. */}
            <Row
              icon="language-outline"
              label={s.me.language}
              value={preference ? LANGUAGE_NAMES[preference] : phoneOption}
              accessibilityLabel={s.me.languageRow(preference ? LANGUAGE_NAMES[preference] : phoneOption)}
              onPress={() => setChoosingLanguage(true)}
              last
            />
          </View>

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

/// One setting: what it is on the left, what it is set to on the right, and a chevron that says
/// it leads somewhere.
function Row({
  icon,
  label,
  value,
  accessibilityLabel,
  onPress,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  accessibilityLabel?: string;
  onPress: () => void;
  last?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      android_ripple={{ color: c.border }}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: c.border, backgroundColor: pressed ? c.surfaceMuted : 'transparent' },
        last && styles.lastRow,
      ]}>
      <Ionicons name={icon} size={22} color={c.textMuted} aria-hidden />
      <Text style={[type.label, { color: c.text }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[type.caption, styles.rowValue, { color: c.textMuted }]} numberOfLines={1}>
        {value}
      </Text>
      <Ionicons name="chevron-forward" size={20} color={c.textMuted} aria-hidden />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  rows: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lastRow: { borderBottomWidth: 0 },
  rowValue: { flex: 1, textAlign: 'right' },
  body: { padding: space.md, gap: space.lg },
  identity: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  identityText: { flex: 1, gap: space.xs },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  separated: { paddingTop: space.lg, borderTopWidth: StyleSheet.hairlineWidth },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
