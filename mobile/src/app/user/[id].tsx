import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { useDecide, useMe, useProfile, useRequests, useReviews, useSentRequests } from '@/api/hooks';
import { DAYS, LIFE_ICON, roleName, STYLE_ICON, TIMES_OF_DAY } from '@/api/labels';
import { ActionError } from '@/components/ActionError';
import { AskSheet } from '@/components/AskSheet';
import { AuthedImage } from '@/components/AuthedImage';
import { Avatar } from '@/components/Avatar';
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

/// How many references show before "See all": enough to read the tone, short enough to keep the
/// unlock link in reach.
const FIRST_REFERENCES = 3;

/// The paid "skip the wait" is hidden while the pilot is free (owner, 2026-11-17): testers read it
/// as a contradiction of "Nobody pays anybody". The sheet and the API stay; flip this to offer it.
const PAID_UNLOCK: boolean = false;

/// The expanded profile, and the only place the paid unlock appears: keeping it off the
/// discovery card is what stops an accidental charge mid-scroll (GUIDELINES §11.2).
export default function Profile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const s = useStrings();

  const { data, isPending, error, refetch } = useProfile(id);
  const { interest, pass, undoPass } = useDecide();
  const busy = interest.isPending || pass.isPending;
  // Already asked and still waiting: the server answers a second ask with 409, and a pass then
  // changes nothing. shortcut: only the loaded pages of the list count, enough for a demo-sized one.
  // A one-sided ask that just landed counts at once, before the sent list has refetched.
  const sent = useSentRequests().items;
  const asked = interest.data?.matched === false || sent.some((card) => card.id === id);
  // They asked me first: "Ask to meet" is then a yes, and their note leads the profile.
  // shortcut: only the loaded pages count, as for `asked`.
  const askedMe = useRequests().items.find((card) => card.id === id);
  // My own profile, opened from "Preview my profile" on Me: shown as others see it, with nothing
  // to ask, pass, unlock, report or block.
  const own = useMe().data?.id === id;
  const notice = useNotice();
  const [asking, setAsking] = useState(false);
  const [safety, setSafety] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  // The floating action row's height, so the end of the profile can scroll clear of it.
  const [barHeight, setBarHeight] = useState(0);

  // Reached by link or after a reload there is no screen to go back to, and router.back()
  // would leave the member stuck on a profile they have just passed on.
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/discover'));

  const [matched, setMatched] = useState<string | null>(null);

  /// `mutate` rather than `mutateAsync`: a refusal from the server would otherwise be a
  /// rejected promise nobody awaits, leaving a button that looks like it did nothing. The
  /// refusal goes to `interest.error`, which the action bar shows, and the sheet while it is open.
  function send(note?: string) {
    interest.mutate({ id, note }, {
      // A mutual yes gets its moment. A one-sided one stays on the profile, whose button now
      // says it is waiting, with a word that it left and what happens next.
      onSuccess: (result) => {
        setAsking(false);
        if (result.matched && result.conversationId) return setMatched(result.conversationId);
        if (data) {
          notice({ title: s.profile.asked(data.name!), body: s.profile.askedBody(data.name!), photoPath: hero?.url });
        }
      },
      // Unverified: the bar's note carries the way out, so the sheet steps aside for it.
      onError: (failure) => {
        if (failure instanceof ApiError && failure.code === 'identity_verification_required') setAsking(false);
      },
    });
  }

  // A yes back needs no note: their request already says why (ADR-0015).
  function ask() {
    if (askedMe) return send();
    interest.reset(); // the sheet opens without the last refusal
    setAsking(true);
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
  // The generated type allows a string for an int32; the server always sends a number.
  const references = Number(data?.references ?? 0);

  return (
    <Screen loading={isPending} error={error} onRetry={refetch}>
      <View style={[styles.page, { backgroundColor: c.background }]}>
        <ScrollView
          // The last line clears the floating action row, measured, so a refusal note above the
          // buttons or a taller font cannot cover the end of the profile.
          contentContainerStyle={{ paddingBottom: Math.max(barHeight, insets.bottom + 56) + space.lg }}
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
            {own ? null : (
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
            )}

            <AuthedImage
              path={hero?.url}
              size="medium"
              style={[styles.hero, { backgroundColor: c.surfaceMuted }]}
              accessibilityLabel={s.common.photoOf(data?.name ?? '')}
            />
          </View>

          <View style={styles.body}>
            {own ? (
              <View style={[styles.preview, { backgroundColor: c.surfaceMuted }]}>
                <Ionicons name="eye-outline" size={18} color={c.textMuted} aria-hidden />
                <Text style={[type.caption, styles.previewText, { color: c.text }]}>{s.profile.previewBanner}</Text>
              </View>
            ) : null}

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
            {references ||
            data?.freeToday ||
            data?.listing?.offersOvernight ||
            data?.hasCar ||
            data?.hasPets ||
            data?.smokes ||
            data?.activityStyle ||
            data?.lifestyle ? (
              <View style={styles.pills}>
                {data?.freeToday ? <Pill icon="cafe-outline" label={s.common.freeToday} tone="strong" /> : null}
                {references ? <Pill icon="thumbs-up-outline" label={s.common.references(references)} /> : null}
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

            {/* Why they asked, first: it is what I am deciding on (ADR-0015). */}
            {askedMe?.note ? (
              <View style={[styles.letter, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Text role="heading" style={[type.label, { color: c.textMuted }]}>
                  {s.profile.noteTitle(data?.name ?? '')}
                </Text>
                <Text style={[type.body, { color: c.text }]}>{askedMe.note}</Text>
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

            {data ? (
              <References
                userId={id}
                total={references}
                fromTravellers={Number(data.referencesAsHost ?? 0)}
                fromHosts={Number(data.referencesAsTraveller ?? 0)}
              />
            ) : null}

            {/* Deliberately away from the free actions and visually quieter: paying is a
                separate decision, not a third button of equal weight. Not offered to someone who
                already asked me: there is no wait to skip. */}
            {!PAID_UNLOCK || askedMe || own ? null : (
              <Button
                title={s.profile.unlock}
                variant="quiet"
                disabled={busy || !data}
                onPress={() => setUnlocking(true)}
              />
            )}
          </View>
        </ScrollView>

        {/* Floats over the profile with no bar behind it: the two controls carry their own
            surfaces, Card with a hairline and Coral. */}
        {own ? null : (
          <View
            onLayout={(event) => setBarHeight(event.nativeEvent.layout.height)}
            style={[styles.bar, { paddingBottom: insets.bottom + space.md }]}>
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
                  // They asked first: the same button is a yes back, said as one (ADR-0015).
                  <Button
                    title={askedMe ? s.requests.accept : s.profile.ask}
                    icon={askedMe ? 'checkmark' : 'chatbubble-ellipses-outline'}
                    loading={interest.isPending}
                    disabled={busy}
                    onPress={ask}
                  />
                )}
              </View>
            </View>
          </View>
        )}

        {asking && data ? (
          <AskSheet
            user={{ name: data.name!, city: data.city! }}
            pending={interest.isPending}
            error={interest.error}
            onSend={send}
            onClose={() => setAsking(false)}
          />
        ) : null}

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

/// What people who actually met them wrote (ADR-0017): who, how they met, a thumb, the words.
/// Shown on my own preview too, and with none yet, so the section always says where trust comes from.
function References({
  userId,
  total,
  fromTravellers,
  fromHosts,
}: {
  userId: string;
  total: number;
  fromTravellers: number;
  fromHosts: number;
}) {
  const c = useColors();
  const s = useStrings();
  const { language } = useLanguage();
  const { items, hasNextPage, isFetchingNextPage, loadMore } = useReviews(userId);
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? items : items.slice(0, FIRST_REFERENCES);
  // "6 references · 5 from travellers · 1 from hosts", leaving out the parts that are 0.
  const summary = [
    s.common.references(total),
    fromTravellers ? s.profile.fromTravellers(fromTravellers) : null,
    fromHosts ? s.profile.fromHosts(fromHosts) : null,
  ]
    .filter(Boolean)
    .join(' · ');
  // From the reader's side: the author hosted this member, so the author is the host.
  const roles = { hosted: s.roles.host, wasHosted: s.roles.guest, metUp: s.profile.metUp };

  return (
    <View style={styles.section}>
      <Text role="heading" style={[type.title, { color: c.text }]}>
        {s.profile.references}
      </Text>
      {total || items.length ? (
        <Text style={[type.caption, { color: c.textMuted }]}>{summary}</Text>
      ) : (
        <Text style={[type.body, { color: c.textMuted }]}>{s.profile.noReferences}</Text>
      )}

      {shown.map((reference) => (
        <View key={reference.id} style={[styles.review, { borderTopColor: c.border }]}>
          <View style={styles.author}>
            <Avatar path={reference.authorPhotoUrl} size={32} photoSize="thumb" aria-hidden />
            <View style={styles.factText}>
              <Text style={[type.label, { color: c.text }]} numberOfLines={1}>
                {reference.authorName}
              </Text>
              <Text style={[type.caption, { color: c.textMuted }]}>
                {[
                  reference.context ? roles[reference.context] : null,
                  new Date(reference.createdAt).toLocaleDateString(language, { month: 'long', year: 'numeric' }),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
          </View>
          {/* Up in the text colour; down in words, muted: never green, never an alarming red
              (DESIGN.md). Old references have no thumb and show none. */}
          {reference.recommend === true ? (
            <Ionicons name="thumbs-up" size={16} color={c.text} role="img" accessibilityLabel={s.profile.recommended} />
          ) : reference.recommend === false ? (
            <View style={styles.notRecommended}>
              <Ionicons name="thumbs-down" size={16} color={c.textMuted} aria-hidden />
              <Text style={[type.caption, { color: c.textMuted }]}>{s.profile.notRecommended}</Text>
            </View>
          ) : null}
          {reference.comment ? (
            <Text style={[type.body, { color: c.text }]}>{reference.comment}</Text>
          ) : null}
        </View>
      ))}

      {/* A button, not an endless scroll: this list sits inside the profile's own ScrollView,
          and a second scrolling region inside the first one fights it. Expanded, it stays only
          while the server has more pages. */}
      {(!expanded && items.length > FIRST_REFERENCES) || (expanded && hasNextPage) ? (
        <Button
          title={s.profile.seeAllReferences(Math.max(total, items.length))}
          variant="quiet"
          loading={isFetchingNextPage}
          onPress={() => {
            setExpanded(true);
            loadMore();
          }}
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
  preview: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, borderRadius: radius.md },
  previewText: { flex: 1 },
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
  author: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  notRecommended: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
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
