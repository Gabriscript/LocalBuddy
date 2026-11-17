import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDecide, useProfile, useReviews, useSentRequests } from '@/api/hooks';
import { DAYS, LIFE_ICON, roleName, STYLE_ICON, TIMES_OF_DAY } from '@/api/labels';
import { ActionError } from '@/components/ActionError';
import { AuthedImage } from '@/components/AuthedImage';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { MatchBurst } from '@/components/MatchBurst';
import { Pill } from '@/components/Pill';
import { SafetySheet } from '@/components/SafetySheet';
import { Screen } from '@/components/Screen';
import { UnlockSheet } from '@/components/UnlockSheet';
import { useLanguage, useStrings } from '@/i18n';
import { useNotice } from '@/lib/notice';
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
  const { interest, pass, undoPass } = useDecide();
  const busy = interest.isPending || pass.isPending;
  // Already asked and still waiting: the server answers a second ask with 409, and a pass then
  // changes nothing. shortcut: only the loaded pages of the list count, enough for a demo-sized one.
  const asked = useSentRequests().items.some((card) => card.id === id);
  const notice = useNotice();
  const [safety, setSafety] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  // Reached by link or after a reload there is no screen to go back to, and router.back()
  // would leave the member stuck on a profile they have just passed on.
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/discover'));

  const [matched, setMatched] = useState<string | null>(null);

  /// `mutate` rather than `mutateAsync`: a refusal from the server would otherwise be a
  /// rejected promise nobody awaits, leaving a button that looks like it did nothing. The
  /// refusal goes to `interest.error`, which the action bar shows.
  function ask() {
    interest.mutate(id, {
      // A mutual yes gets its moment. A one-sided one returns to the feed, with a word that it
      // left and what happens next: without it the tap looked like it had done nothing.
      onSuccess: (result) => {
        if (result.matched && result.conversationId) return setMatched(result.conversationId);
        goBack();
        if (data) {
          notice({ title: s.profile.asked(data.name!), body: s.profile.askedBody(data.name!), photoPath: hero?.url });
        }
      },
    });
  }

  function passOn() {
    pass.mutate(id, {
      onSuccess: () => {
        goBack();
        if (data) {
          notice({
            title: s.discover.passed(data.name!),
            photoPath: hero?.url,
            action: { label: s.common.undo, onPress: () => undoPass.mutate(id) },
          });
        }
      },
    });
  }

  const photos = data?.photos ?? [];
  // The face leads; the home photos follow the words, as a row of thumbnails.
  const hero = photos.find((p) => p.type === 'profile') ?? photos[0];
  const others = photos.filter((p) => p !== hero);
  const days = DAYS.filter((day) => data?.usualDays?.includes(day)).map((day) => s.days[day]);
  const times = TIMES_OF_DAY.filter((time) => data?.availability?.some((slot) => slot.timeOfDay === time)).map(
    (time) => s.timeOfDay[time]
  );
  // "Sat, Sun · Evening": the days and the hours answer one question, so they share one line.
  const free = [days.join(', '), times.join(', ')].filter(Boolean).join(' · ');

  return (
    <Screen loading={isPending} error={error} onRetry={refetch}>
      <View style={[styles.page, { backgroundColor: c.background }]}>
        <ScrollView
          // The last line clears the floating action row: its 56pt, the inset under it, and
          // room for the refusal note that can appear above it.
          contentContainerStyle={{ paddingBottom: insets.bottom + 56 + space.xxl + space.lg }}
          showsVerticalScrollIndicator={false}>
          <View>
            {/* Part of the hero, so they scroll away with the photo instead of sitting on the name.
                First in the tree, so a screen reader reaches them before the whole profile. zIndex
                keeps them drawn above the photo. */}
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

            <AuthedImage
              path={hero?.url}
              size="medium"
              style={[styles.hero, { backgroundColor: c.surfaceMuted }]}
              accessibilityLabel={s.common.photoOf(data?.name ?? '')}
            />
          </View>

          <View style={styles.body}>
            <View>
              <Text role="heading" style={[type.display, { color: c.text }]}>
                {data?.name}
              </Text>
              <Text style={[type.body, { color: c.textMuted }]}>
                {data?.city} · {roleName(data?.role, s)}
              </Text>
              {data?.identityVerified ? (
                <View style={styles.verified}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={c.success} aria-hidden />
                  <Text style={[type.label, { color: c.success }]}>{s.common.verified}</Text>
                </View>
              ) : null}
            </View>

            {/* Left out when empty: an empty row would still take a gap's worth of height. */}
            {typeof data?.rating === 'number' ||
            data?.freeToday ||
            data?.listing?.offersOvernight ||
            data?.hasCar ||
            data?.hasPets ||
            data?.smokes ||
            data?.activityStyle ||
            data?.lifestyle ? (
              <View style={styles.pills}>
                {data?.freeToday ? <Pill icon="cafe-outline" label={s.common.freeToday} tone="strong" /> : null}
                {typeof data?.rating === 'number' ? (
                  <Pill icon="star-outline" label={s.profile.rating(data.rating.toLocaleString(language, ONE_DECIMAL))} />
                ) : null}
                {data?.listing?.offersOvernight ? <Pill icon="bed-outline" label={s.common.canHostOvernight} /> : null}
                {data?.hasCar ? <Pill icon="car-outline" label={s.common.hasCar} /> : null}
                {data?.hasPets ? <Pill icon="paw-outline" label={s.common.pets} /> : null}
                {data?.smokes ? <Pill icon="flame-outline" label={s.common.smokes} /> : null}
                {data?.activityStyle ? (
                  <Pill icon={STYLE_ICON[data.activityStyle]} label={s.activityStyle[data.activityStyle]} />
                ) : null}
                {data?.lifestyle ? <Pill icon={LIFE_ICON[data.lifestyle]} label={s.lifestyle[data.lifestyle]} /> : null}
              </View>
            ) : null}

            {/* The letter of introduction, made literal: the one paragraph the profile exists to
                say, on a sheet of its own, signed by the person who wrote it. */}
            {data?.whatWeWillDo ? (
              <View style={[styles.letter, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Text role="heading" style={[type.label, { color: c.textMuted }]}>
                  {s.profile.whatWeDo}
                </Text>
                <Text style={[type.lead, { color: c.text }]}>{data.whatWeWillDo}</Text>
                <Text aria-hidden style={[type.title, styles.signature, { color: c.text }]} numberOfLines={1}>
                  {data.name}
                </Text>
              </View>
            ) : null}

            <Section title={s.profile.whyHost} body={data?.whyIHost} />

            {/* The practical answers, as rows: found at a glance when deciding whether to ask. */}
            {data?.languagesSpoken || free ? (
              <View style={[styles.facts, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Fact icon="chatbubbles-outline" label={s.profile.languages} value={data?.languagesSpoken} />
                <Fact icon="calendar-outline" label={s.profileFields.usualDays} value={free} />
              </View>
            ) : null}

            {others.length ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.strip}>
                {others.map((photo) => (
                  <AuthedImage
                    key={photo.id}
                    path={photo.url}
                    size="medium"
                    style={[styles.thumb, { backgroundColor: c.surfaceMuted }]}
                    accessibilityLabel={s.profile.anotherPhotoOf(data?.name ?? '')}
                  />
                ))}
              </ScrollView>
            ) : null}

            <Reviews userId={id} />

            {/* Deliberately away from the free actions and visually quieter: paying is a
                separate decision, not a third button of equal weight. */}
            <Button
              title={s.profile.unlock}
              variant="quiet"
              disabled={busy || !data}
              onPress={() => setUnlocking(true)}
            />
          </View>
        </ScrollView>

        {/* Floats over the profile with no bar behind it: the two controls carry their own
            surfaces, Card with a hairline and Coral. */}
        <View style={[styles.bar, { paddingBottom: insets.bottom + space.md }]}>
          {/* With the buttons that failed, not on a screen of its own: the profile behind it
              is still perfectly readable. */}
          <ActionError error={interest.error ?? pass.error} />

          <View style={styles.barRow}>
            {asked ? null : (
              <IconButton
                name="close"
                label={s.profileCard.passOn(data?.name ?? '')}
                tint={c.textMuted}
                disabled={busy}
                onPress={passOn}
              />
            )}
            <View style={styles.barItem}>
              {asked ? (
                <Button title={s.profile.askedWaiting} icon="time-outline" disabled onPress={() => {}} />
              ) : (
                <Button
                  title={s.profile.ask}
                  icon="chatbubble-ellipses-outline"
                  loading={interest.isPending}
                  disabled={busy}
                  onPress={ask}
                />
              )}
            </View>
          </View>
        </View>

        {matched && data ? (
          <MatchBurst
            name={data.name!}
            photoPath={hero?.url}
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

/// One practical answer: what it is in Muted Text, the answer under it. Nothing when unanswered.
function Fact({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | null;
}) {
  const c = useColors();
  if (!value) return null;
  return (
    <View style={styles.fact}>
      <Ionicons name={icon} size={20} color={c.textMuted} aria-hidden />
      <View style={styles.factText}>
        <Text style={[type.caption, { color: c.textMuted }]}>{label}</Text>
        <Text style={[type.body, { color: c.text }]}>{value}</Text>
      </View>
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
  verified: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.xs },
  strip: { gap: space.sm },
  thumb: { width: 96, height: 96, borderRadius: radius.md },
  body: { padding: space.md, gap: space.lg },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  section: { gap: space.sm },
  letter: { gap: space.sm, padding: space.lg, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth },
  // Right-aligned and in the names' own face, the way a letter is signed.
  signature: { textAlign: 'right', marginTop: space.xs },
  facts: {
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  fact: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  factText: { flex: 1, gap: 2 },
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
    paddingHorizontal: space.md,
    gap: space.sm,
  },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  barItem: { flex: 1 },
});
