import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDecide, useProfile, useReviews } from '@/api/hooks';
import { AuthedImage } from '@/components/AuthedImage';
import { Button } from '@/components/Button';
import { Pill } from '@/components/Pill';
import { SafetySheet } from '@/components/SafetySheet';
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
  const [safety, setSafety] = useState(false);

  // Reached by link or after a reload there is no screen to go back to, and router.back()
  // would leave the member stuck on a profile they have just passed on.
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/discover'));

  async function showInterest() {
    const result = await interest.mutateAsync(id);
    if (result.matched && result.conversationId) {
      router.replace({ pathname: '/chat/[id]', params: { id: result.conversationId } });
    } else {
      goBack();
    }
  }

  const photos = data?.photos ?? [];

  return (
    <Screen loading={isPending} error={error} onRetry={refetch}>
      <View style={[styles.page, { backgroundColor: c.background }]}>
        {/* First in the tree, so a screen reader reaches it before the whole profile rather
            than after it. zIndex keeps it drawn above the photo it floats on. */}
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={[styles.back, { top: insets.top + space.sm, backgroundColor: c.surface, borderColor: c.border }]}>
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>

        {/* Reporting and blocking live here rather than in the action bar: they are not a
            third choice next to pass and interest, they are what you reach for when something
            is wrong. */}
        <Pressable
          onPress={() => setSafety(true)}
          disabled={!data}
          accessibilityRole="button"
          accessibilityLabel="Report or block"
          style={[
            styles.more,
            { top: insets.top + space.sm, backgroundColor: c.surface, borderColor: c.border },
          ]}>
          <Ionicons name="ellipsis-horizontal" size={22} color={c.text} aria-hidden />
        </Pressable>

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
              <Text role="heading" style={[type.display, { color: c.text }]}>
                {data?.name}
              </Text>
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
            <Reviews userId={id} />
          </View>
        </ScrollView>

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
                onPress={() => pass.mutateAsync(id).then(goBack)}
              />
            </View>
            <View style={styles.barItem}>
              <Button title="Show interest" loading={interest.isPending} disabled={busy} onPress={showInterest} />
            </View>
          </View>
          {/* Deliberately below the free actions and visually quieter: paying is a separate
              decision, not a third button of equal weight. */}
          <Button
            title="Unlock the chat without a match"
            variant="quiet"
            disabled={busy}
            onPress={() => {}}
          />
        </View>

        {safety && data ? (
          <SafetySheet
            user={{ id: data.id!, name: data.name! }}
            onClose={() => setSafety(false)}
            // Blocked, so this profile no longer exists for either of them.
            onBlocked={() => router.replace('/discover')}
          />
        ) : null}
      </View>
    </Screen>
  );
}

/// What people who actually met them wrote. The API does not say who wrote a review, so none
/// of these carry a name.
function Reviews({ userId }: { userId: string }) {
  const c = useColors();
  const { data } = useReviews(userId);
  const reviews = data?.items ?? [];
  if (!reviews.length) return null;

  return (
    <View style={styles.section}>
      <Text role="heading" style={[type.title, { color: c.text }]}>
        What people say
      </Text>
      {reviews.map((review) => (
        <View key={review.id} style={[styles.review, { borderTopColor: c.border }]}>
          {/* role="img": five hidden glyphs that together mean one thing, and a bare label on
              a plain container is announced by nothing. */}
          <View role="img" aria-label={`Rated ${review.rating} out of 5`} style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= Number(review.rating) ? 'star' : 'star-outline'}
                size={14}
                color={c.text}
                aria-hidden
              />
            ))}
            <Text style={[type.caption, { color: c.textMuted }]}>
              {new Date(review.createdAt).toLocaleDateString()}
            </Text>
          </View>
          {review.comment ? (
            <Text style={[type.body, { color: c.text }]}>{review.comment}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function Section({ title, body }: { title: string; body?: string | null }) {
  const c = useColors();
  if (!body) return null;
  return (
    <View style={styles.section}>
      <Text role="heading" style={[type.title, { color: c.text }]}>
        {title}
      </Text>
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
    zIndex: 1,
    left: space.md,
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  more: {
    position: 'absolute',
    zIndex: 1,
    right: space.md,
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  review: { gap: space.xs, paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 2 },
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
