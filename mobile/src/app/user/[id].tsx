import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDecide, useProfile, useReviews } from '@/api/hooks';
import { roleName } from '@/api/labels';
import { ActionError } from '@/components/ActionError';
import { AuthedImage } from '@/components/AuthedImage';
import { Button } from '@/components/Button';
import { MatchBurst } from '@/components/MatchBurst';
import { Pill } from '@/components/Pill';
import { SafetySheet } from '@/components/SafetySheet';
import { Screen } from '@/components/Screen';
import { UnlockSheet } from '@/components/UnlockSheet';
import { useLanguage, useStrings } from '@/i18n';
import { radius, space, type, useColors } from '@/theme';

const ONE_DECIMAL = { minimumFractionDigits: 1, maximumFractionDigits: 1 };

/// The expanded profile, and the only place the paid unlock appears: keeping it off the
/// discovery card is what stops an accidental charge mid-scroll (GUIDELINES §11.2).
export default function Profile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const s = useStrings();
  const { language } = useLanguage();

  const { data, isPending, error, refetch } = useProfile(id);
  const { interest, pass } = useDecide();
  const busy = interest.isPending || pass.isPending;
  const [safety, setSafety] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  // Reached by link or after a reload there is no screen to go back to, and router.back()
  // would leave the member stuck on a profile they have just passed on.
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/discover'));

  const [matched, setMatched] = useState<string | null>(null);

  /// `mutate` rather than `mutateAsync`: a refusal from the server would otherwise be a
  /// rejected promise nobody awaits, leaving a button that looks like it did nothing. The
  /// refusal goes to `interest.error`, which the action bar shows.
  function showInterest() {
    interest.mutate(id, {
      // A mutual yes gets its moment; a one-sided one just returns to the feed.
      onSuccess: (result) =>
        result.matched && result.conversationId ? setMatched(result.conversationId) : goBack(),
    });
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
          accessibilityLabel={s.common.goBack}
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
          accessibilityLabel={s.profile.reportOrBlock}
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
            accessibilityLabel={s.common.photoOf(data?.name ?? '')}
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
                  accessibilityLabel={s.profile.anotherPhotoOf(data?.name ?? '')}
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
                {data?.city} · {roleName(data?.role, s)}
              </Text>
            </View>

            <View style={styles.pills}>
              {data?.identityVerified ? (
                <Pill icon="shield-checkmark-outline" label={s.common.verified} tone="positive" />
              ) : null}
              {typeof data?.rating === 'number' ? (
                <Pill icon="star-outline" label={s.profile.rating(data.rating.toLocaleString(language, ONE_DECIMAL))} />
              ) : null}
              {data?.listing?.offersOvernight ? <Pill icon="bed-outline" label={s.common.canHostOvernight} /> : null}
              {data?.hasCar ? <Pill icon="car-outline" label={s.common.hasCar} /> : null}
              {data?.hasPets ? <Pill icon="paw-outline" label={s.common.pets} /> : null}
              {data?.smokes ? <Pill icon="flame-outline" label={s.common.smokes} /> : null}
            </View>

            <Section title={s.profile.whatWeDo} body={data?.whatWeWillDo} />
            <Section title={s.profile.whyHost} body={data?.whyIHost} />
            <Section title={s.profile.languages} body={data?.languagesSpoken} />
            <Reviews userId={id} />
          </View>
        </ScrollView>

        <View
          style={[
            styles.bar,
            { paddingBottom: insets.bottom + space.md, backgroundColor: c.surface, borderTopColor: c.border },
          ]}>
          {/* With the buttons that failed, not on a screen of its own: the profile behind it
              is still perfectly readable. */}
          <ActionError error={interest.error ?? pass.error} />

          <View style={styles.barRow}>
            <View style={styles.barItem}>
              <Button
                title={s.profile.pass}
                variant="secondary"
                disabled={busy}
                onPress={() => pass.mutate(id, { onSuccess: goBack })}
              />
            </View>
            <View style={styles.barItem}>
              <Button title={s.profile.showInterest} loading={interest.isPending} disabled={busy} onPress={showInterest} />
            </View>
          </View>
          {/* Deliberately below the free actions and visually quieter: paying is a separate
              decision, not a third button of equal weight. */}
          <Button
            title={s.profile.unlock}
            variant="quiet"
            disabled={busy || !data}
            onPress={() => setUnlocking(true)}
          />
        </View>

        {matched && data ? (
          <MatchBurst
            name={data.name!}
            photoPath={photos[0]?.url}
            onSayHello={() =>
              router.replace({ pathname: '/chat/[id]', params: { id: matched } })
            }
            // No "their profile" here: it is the screen behind the burst.
            onClose={goBack}
          />
        ) : null}

        {unlocking && data ? (
          <UnlockSheet
            user={{ id: data.id!, name: data.name! }}
            onClose={() => setUnlocking(false)}
            onUnlocked={(conversationId) =>
              router.replace({ pathname: '/chat/[id]', params: { id: conversationId } })
            }
          />
        ) : null}

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
  const s = useStrings();
  const { language } = useLanguage();
  const { items, hasNextPage, isFetchingNextPage, loadMore } = useReviews(userId);
  if (!items.length) return null;

  return (
    <View style={styles.section}>
      <Text role="heading" style={[type.title, { color: c.text }]}>
        {s.profile.reviews}
      </Text>
      {items.map((review) => (
        <View key={review.id} style={[styles.review, { borderTopColor: c.border }]}>
          {/* role="img": five hidden glyphs that together mean one thing, and a bare label on
              a plain container is announced by nothing. */}
          <View role="img" aria-label={s.profile.ratedOutOf5(Number(review.rating))} style={styles.stars}>
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
              {new Date(review.createdAt).toLocaleDateString(language)}
            </Text>
          </View>
          {review.comment ? (
            <Text style={[type.body, { color: c.text }]}>{review.comment}</Text>
          ) : null}
        </View>
      ))}

      {/* A button, not an endless scroll: this list sits inside the profile's own ScrollView,
          and a second scrolling region inside the first one fights it. */}
      {hasNextPage ? (
        <Button
          title={s.profile.moreReviews}
          variant="quiet"
          loading={isFetchingNextPage}
          onPress={loadMore}
        />
      ) : null}
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
