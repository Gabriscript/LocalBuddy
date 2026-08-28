import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDecide, useProfile } from '@/api/hooks';
import { AuthedImage } from '@/components/AuthedImage';
import { Button } from '@/components/Button';
import { Pill } from '@/components/Pill';
import { Screen } from '@/components/Screen';
import { radius, space, type, useColors } from '@/theme';

/// The expanded profile, and the only place the paid unlock appears: keeping it off the
/// discovery card is what stops an accidental charge mid-scroll (GUIDELINES §11.2).
export default function Profile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();

  const { data, isPending, error, refetch } = useProfile(id);
  const { interest, pass } = useDecide();
  const busy = interest.isPending || pass.isPending;

  async function showInterest() {
    const result = await interest.mutateAsync(id);
    if (result.matched && result.conversationId) {
      router.replace({ pathname: '/chat/[id]', params: { id: result.conversationId } });
    } else {
      router.back();
    }
  }

  const photos = data?.photos ?? [];

  return (
    <Screen loading={isPending} error={error} onRetry={refetch}>
      <View style={[styles.page, { backgroundColor: c.background }]}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}>
          <AuthedImage
            path={photos[0]?.url}
            style={[styles.hero, { backgroundColor: c.surfaceMuted }]}
            accessibilityLabel={`Photo of ${data?.name}`}
          />

          {photos.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.strip}>
              {photos.slice(1).map((photo) => (
                <AuthedImage
                  key={photo.id}
                  path={photo.url}
                  style={[styles.thumb, { backgroundColor: c.surfaceMuted }]}
                  accessibilityLabel={`Another photo of ${data?.name}`}
                />
              ))}
            </ScrollView>
          ) : null}

          <View style={styles.body}>
            <View>
              <Text style={[type.display, { color: c.text }]}>{data?.name}</Text>
              <Text style={[type.body, { color: c.textMuted }]}>
                {data?.city} · {data?.role}
              </Text>
            </View>

            <View style={styles.pills}>
              {data?.identityVerified ? (
                <Pill icon="shield-checkmark-outline" label="Verified" tone="positive" />
              ) : null}
              {typeof data?.rating === 'number' ? (
                <Pill icon="star-outline" label={`${data.rating.toFixed(1)} rating`} />
              ) : null}
              {data?.listing?.offersOvernight ? <Pill icon="bed-outline" label="Can host overnight" /> : null}
              {data?.hasCar ? <Pill icon="car-outline" label="Has a car" /> : null}
              {data?.hasPets ? <Pill icon="paw-outline" label="Pets" /> : null}
              {data?.smokes ? <Pill icon="flame-outline" label="Smokes" /> : null}
            </View>

            <Section title="What we'll do" body={data?.whatWeWillDo} />
            <Section title="Why I host" body={data?.whyIHost} />
            <Section title="Languages" body={data?.languagesSpoken} />
          </View>
        </ScrollView>

        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={[styles.back, { top: insets.top + space.sm, backgroundColor: c.surface, borderColor: c.border }]}>
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>

        <View
          style={[
            styles.bar,
            { paddingBottom: insets.bottom + space.md, backgroundColor: c.surface, borderTopColor: c.border },
          ]}>
          <View style={styles.barRow}>
            <View style={styles.barItem}>
              <Button
                title="Pass"
                variant="secondary"
                disabled={busy}
                onPress={() => pass.mutateAsync(id).then(() => router.back())}
              />
            </View>
            <View style={styles.barItem}>
              <Button title="Show interest" loading={interest.isPending} disabled={busy} onPress={showInterest} />
            </View>
          </View>
          {/* Deliberately below the free actions and visually quieter: paying is a separate
              decision, not a third button of equal weight. */}
          <Button
            title="Skip the match — unlock chat now"
            variant="quiet"
            disabled={busy}
            onPress={() => {}}
          />
        </View>
      </View>
    </Screen>
  );
}

function Section({ title, body }: { title: string; body?: string | null }) {
  const c = useColors();
  if (!body) return null;
  return (
    <View style={styles.section}>
      <Text style={[type.title, { color: c.text }]}>{title}</Text>
      <Text style={[type.body, { color: c.text }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  hero: { width: '100%', aspectRatio: 4 / 3 },
  strip: { gap: space.sm, padding: space.md },
  thumb: { width: 96, height: 96, borderRadius: radius.md },
  body: { padding: space.md, gap: space.lg },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  section: { gap: space.sm },
  back: {
    position: 'absolute',
    left: space.md,
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: space.md,
    gap: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  barRow: { flexDirection: 'row', gap: space.sm },
  barItem: { flex: 1 },
});
