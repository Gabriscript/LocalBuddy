import { useLocalSearchParams, useRouter, useScrollToTop } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import type { components } from '@/api/generated';
import { useDecide, useDiscovery, useMe, useRequests, useTrips, type DiscoveryFilters } from '@/api/hooks';
import type { ActivityStyle, DayOfWeek, Lifestyle, TimeOfDay } from '@/api/labels';
import { useRefusalNotice } from '@/components/ActionError';
import { AskSheet } from '@/components/AskSheet';
import { Button } from '@/components/Button';
import { DestinationSearch } from '@/components/DestinationSearch';
import { FilterSheet } from '@/components/FilterSheet';
import { IconButton } from '@/components/IconButton';
import { Leaving } from '@/components/Leaving';
import { MatchBurst } from '@/components/MatchBurst';
import { ProfileCard } from '@/components/ProfileCard';
import { LoadingMore, Screen } from '@/components/Screen';
import { FeedSkeleton } from '@/components/Skeleton';
import { useTabBarClearance } from '@/components/TabBar';
import { TabHeader } from '@/components/TabHeader';
import { TripBar } from '@/components/TripBar';
import { useStrings } from '@/i18n';
import { isoDay, overlaps } from '@/lib/dates';
import { useNotice } from '@/lib/notice';
import { radius, space, type, useColors } from '@/theme';

/// Route params are strings; the query takes booleans and a list of times of day.
type Params = {
  city?: string;
  role?: string;
  offersOvernight?: string;
  freeToday?: string;
  timeOfDay?: string;
  hasCar?: string;
  smokes?: string;
  hasPets?: string;
  days?: string;
  activityStyle?: string;
  lifestyle?: string;
};

type Card = components['schemas']['ProfileCard'];
type Match = { userId: string; name: string; photoUrl?: string | null; conversationId: string };

const asBool = (value?: string) => (value === undefined ? undefined : value === 'true');
const asParam = (value?: boolean) => (value === undefined ? undefined : String(value));
/// One array for "nothing to list yet", so the list is not handed a new one on every render.
const NOBODY: Card[] = [];
/// The accounts Discover has already opened on their own trip in this app session. Per account,
/// so signing out and in as somebody else opens on theirs; once only, so a city the member
/// cleared or changed is never put back.
const openedOnTrip = new Set<string>();

export default function Discover() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const clearance = useTabBarClearance();
  const router = useRouter();
  const s = useStrings();
  const notice = useNotice();
  const refuse = useRefusalNotice();
  const roles = [
    { value: undefined, label: s.discover.everyone },
    { value: 'host', label: s.discover.hosts },
    { value: 'guest', label: s.discover.guests },
  ];

  // Filters live in the route, not in a store: they are already persisted, already shareable
  // as a deep link, and cost nothing to keep in sync (ADR-0009).
  const params = useLocalSearchParams<Params>();
  const filters: DiscoveryFilters = {
    city: params.city,
    role: params.role,
    offersOvernight: asBool(params.offersOvernight),
    freeToday: asBool(params.freeToday),
    hasCar: asBool(params.hasCar),
    smokes: asBool(params.smokes),
    hasPets: asBool(params.hasPets),
    // One comma-separated param rather than a repeated one: shorter link, one thing to parse.
    timeOfDay: params.timeOfDay ? (params.timeOfDay.split(',') as TimeOfDay[]) : undefined,
    days: params.days ? (params.days.split(',') as DayOfWeek[]) : undefined,
    activityStyle: params.activityStyle as ActivityStyle | undefined,
    lifestyle: params.lifestyle as Lifestyle | undefined,
  };

  // A member with a trip lands on the people of that city: the first time Discover shows for
  // this account, unless a city is already chosen. Waits for both queries, which may arrive
  // after the first render.
  const myId = useMe().data?.id;
  const { items: myTrips, isPending: tripsPending } = useTrips();
  const today = isoDay();
  const cityParam = params.city;
  useEffect(() => {
    if (!myId || tripsPending || openedOnTrip.has(myId)) return;
    openedOnTrip.add(myId);
    if (cityParam) return;
    const next = myTrips.filter((trip) => trip.to >= today).sort((a, b) => a.from.localeCompare(b.from))[0];
    if (next) router.setParams({ city: next.city });
  }, [myId, tripsPending, myTrips, cityParam, today, router]);

  const [filtering, setFiltering] = useState(false);
  // Role and city are not counted: each has its own control right there, in view.
  const active = [
    filters.offersOvernight,
    filters.freeToday,
    filters.hasCar,
    filters.smokes,
    filters.hasPets,
    filters.timeOfDay,
    filters.days,
    filters.activityStyle,
    filters.lifestyle,
  ].filter((value) => value !== undefined).length;

  function applyFilters(next: DiscoveryFilters) {
    setFiltering(false);
    // Every key the sheet owns, including the cleared ones: setParams merges, so a key left
    // out would keep its old value. Role and city are left out on purpose, and survive.
    router.setParams({
      offersOvernight: next.offersOvernight ? 'true' : undefined,
      freeToday: next.freeToday ? 'true' : undefined,
      timeOfDay: next.timeOfDay?.length ? next.timeOfDay.join(',') : undefined,
      hasCar: asParam(next.hasCar),
      smokes: asParam(next.smokes),
      hasPets: asParam(next.hasPets),
      days: next.days?.length ? next.days.join(',') : undefined,
      activityStyle: next.activityStyle ?? undefined,
      lifestyle: next.lifestyle ?? undefined,
    });
  }

  const { items, isPending, error, refetch, isRefetching, loadMore, isFetchingNextPage } =
    useDiscovery(filters);
  const { interest, pass, undoPass } = useDecide();
  const busy = interest.isPending || pass.isPending || undoPass.isPending;
  // Who has been answered in this visit. Their card folds away at once, without waiting for
  // the server, and comes back if the server refuses or the pass is undone.
  const [answered, setAnswered] = useState<string[]>([]);
  // The list belongs to one feed: another city or filter set starts it over.
  const feedKey = JSON.stringify(filters);
  const [stackKey, setStackKey] = useState(feedKey);
  if (stackKey !== feedKey) {
    setStackKey(feedKey);
    setAnswered([]);
  }
  const leave = useCallback((id: string) => setAnswered((ids) => [...ids, id]), []);
  const stay = useCallback((id: string) => setAnswered((ids) => ids.filter((other) => other !== id)), []);

  // A reciprocal match is the moment the whole product exists for, so it gets a moment of its
  // own instead of a silent navigation. A request that only left gets a quieter word: it went,
  // and this is what happens next.
  const [match, setMatch] = useState<Match | null>(null);
  // Whose "Ask to meet" sheet is open.
  const [asking, setAsking] = useState<Card | null>(null);

  /// `mutate`, not `mutateAsync`: a refusal from the server is a rejected promise nobody
  /// awaits, and an unverified member got a tap that silently did nothing. This way the refusal
  /// reaches `onError`, which says it out loud wherever the feed is scrolled to.
  ///
  /// These three are stable across renders so that the `memo` on ProfileCard can do its job.
  ///
  /// `note` is undefined only for a yes back, sent without the sheet. From the sheet, any refusal
  /// but the unverified one stays in it, beside the words the member wrote.
  const send = useCallback(
    (card: Card, note?: string) => {
      leave(card.id!);
      interest.mutate({ id: card.id!, note }, {
        onSuccess: (result) => {
          setAsking(null);
          if (result.matched && result.conversationId) {
            setMatch({
              userId: card.id!,
              name: card.name!,
              photoUrl: card.photoUrl,
              conversationId: result.conversationId,
            });
          } else {
            notice({
              title: s.profile.asked(card.name!),
              body: s.profile.askedBody(card.name!),
              photoPath: card.photoUrl,
            });
          }
        },
        onError: (failure) => {
          stay(card.id!);
          const unverified = failure instanceof ApiError && failure.code === 'identity_verification_required';
          if (note === undefined || unverified) {
            setAsking(null);
            refuse(failure);
          }
        },
      });
    },
    [interest, notice, refuse, leave, stay, s]
  );

  // Someone who already asked me gets the yes at once: there is nothing left to explain.
  // shortcut: only the loaded pages of my requests count, enough for a demo-sized list.
  const requests = useRequests().items;
  const ask = useCallback(
    (card: Card) => {
      if (requests.some((asker) => asker.id === card.id)) return send(card);
      interest.reset(); // the sheet opens without the last card's refusal
      setAsking(card);
    },
    [requests, send, interest]
  );

  const showProfile = useCallback(
    (card: Card) => router.push({ pathname: '/user/[id]', params: { id: card.id! } }),
    [router]
  );

  const passOn = useCallback(
    (card: Card) => {
      leave(card.id!);
      pass.mutate(card.id!, {
        // A cross has no words on it, so the first one explains itself here, with the way back.
        onSuccess: () =>
          notice({
            title: s.discover.passed(card.name!),
            photoPath: card.photoUrl,
            action: {
              label: s.common.undo,
              // On success or refusal (e.g. 404) the card is released: a failure must not hide it.
              onPress: () => undoPass.mutate(card.id!, { onSettled: () => stay(card.id!) }),
            },
          }),
        onError: (failure) => {
          stay(card.id!);
          refuse(failure);
        },
      });
    },
    [pass, undoPass, notice, refuse, leave, stay, s]
  );

  // With a city set the server orders the feed: in town now, arriving by date, then residents.
  // A header is drawn where that group changes, so it needs no markers from the server.
  const group = (card?: Card) =>
    !card?.trip ? 'residents' : card.trip.from <= isoDay() ? 'inTown' : 'arriving';
  const showGroups = !!filters.city;

  // Visitors are here, but none on my own dates in this city: said once, so the feed does not
  // read as "nobody overlaps" only after scrolling every card. Only over loaded visitor cards.
  const myTripsHere = myTrips.filter(
    (trip) => trip.to >= today && !!filters.city && trip.city.toLowerCase() === filters.city.toLowerCase()
  );
  const visitors = isPending || error ? NOBODY : items.filter((card) => card.trip);
  const nobodyOnMyDates =
    myTripsHere.length > 0 &&
    visitors.length > 0 &&
    !visitors.some((card) => myTripsHere.some((mine) => overlaps(mine, card.trip!)));
  const renderCard = useCallback(
    ({ item, index }: { item: Card; index: number }) => {
      const heading = showGroups && group(item) !== group(items[index - 1]) ? group(item) : null;
      return (
        <Leaving leaving={answered.includes(item.id!)}>
          <View style={styles.item}>
            {heading ? (
              <Text role="heading" style={[type.label, { color: c.textMuted }]}>
                {s.discover[heading]}
              </Text>
            ) : null}
            <ProfileCard card={item} busy={busy} onOpen={showProfile} onPass={passOn} onInterest={ask} />
          </View>
        </Leaving>
      );
    },
    [busy, showProfile, passOn, ask, showGroups, items, answered, c.textMuted, s]
  );

  // The whole top of the screen scrolls away with the feed, so a person gets the full height
  // of the phone. Tapping the Discover tab again brings the search back.
  const list = useRef<FlatList<Card>>(null);
  useScrollToTop(list);
  // Past the band the status bar is over Paper: its icons turn dark, and a strip of Paper keeps
  // the cards from running under the clock.
  const band = useRef(0);
  const [pastBand, setPastBand] = useState(false);

  const header = (
    <View>
      <View onLayout={(event) => (band.current = event.nativeEvent.layout.height)}>
        <TabHeader title={s.discover.title} lightStatusBar={!pastBand}>
          <DestinationSearch
            city={filters.city}
            onChange={(city) => router.setParams({ city })}
            style={styles.search}
            trailing={
              <IconButton
                name="options-outline"
                // The count is in the label too: a badge read as "Filters" would hide that the
                // feed is already narrowed.
                label={active ? s.discover.filtersLabel(active) : s.discover.filters}
                onPress={() => setFiltering(true)}
                tint={c.onNight}
                band
                badge={active}
              />
            }
          />
          {/* My own trip, tied to the feed: the dates live under Me, where nobody found them. */}
          <TripBar city={filters.city} onSeeCity={(city) => router.setParams({ city })} />
        </TabHeader>
      </View>

      {/* A segmented control: Sunk track, the chosen option a Card thumb. Selection is tone,
          never the accent. */}
      <View
        style={[styles.segments, { backgroundColor: c.surfaceMuted, borderColor: c.border }]}
        role="radiogroup"
        aria-label={s.discover.whoToShow}>
        {roles.map((role) => {
          const selected = params.role === role.value;
          return (
            <Pressable
              key={role.label}
              role="radio"
              aria-checked={selected}
              onPress={() => router.setParams({ role: role.value })}
              style={({ pressed }) => [
                styles.segment,
                {
                  backgroundColor: selected ? c.surface : 'transparent',
                  borderColor: selected ? c.border : 'transparent',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <Text style={[type.label, { color: selected ? c.text : c.textMuted }]} numberOfLines={1}>
                {role.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {nobodyOnMyDates ? (
        <Text style={[type.body, styles.notOnMyDates, { color: c.textMuted }]}>{s.discover.notOnYourDates}</Text>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.page, { backgroundColor: c.background }]}>
      <FlatList
        ref={list}
        // Loading, a failure and an empty feed are drawn inside the list too, so the search and
        // the filters above them never unmount while somebody is typing in them.
        data={isPending || error ? NOBODY : items}
        keyExtractor={(card) => card.id!}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <View style={styles.state}>
            <Screen
              loading={isPending}
              skeleton={<FeedSkeleton />}
              error={error}
              onRetry={refetch}
              empty={active ? s.discover.emptyFiltered : s.discover.empty}
              // Telling somebody to widen their filters without handing them the filters is
              // advice, not a way out.
              emptyAction={
                <Button
                  title={active ? s.discover.changeFilters : s.discover.openFilters}
                  variant="secondary"
                  onPress={() => setFiltering(true)}
                />
              }>
              {null}
            </Screen>
          </View>
        }
        // The last card clears the floating tab bar instead of hiding behind it.
        contentContainerStyle={[styles.list, { paddingBottom: clearance }]}
        showsVerticalScrollIndicator={false}
        // A tap on a suggested city lands while the keyboard is still up.
        keyboardShouldPersistTaps="handled"
        onScroll={(event) => {
          const past = event.nativeEvent.contentOffset.y > band.current - insets.top;
          if (past !== pastBand) setPastBand(past);
        }}
        scrollEventThrottle={32}
        onRefresh={refetch}
        refreshing={isRefetching}
        // The feed is paged: without this it stopped at the first page and looked finished.
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        ListFooterComponent={<LoadingMore visible={isFetchingNextPage} />}
        renderItem={renderCard}
      />

      {pastBand ? <View style={[styles.statusBar, { height: insets.top, backgroundColor: c.background }]} /> : null}

      {filtering ? (
        <FilterSheet value={filters} onClose={() => setFiltering(false)} onApply={applyFilters} />
      ) : null}

      {asking ? (
        <AskSheet
          user={{ name: asking.name!, city: asking.city!, trip: asking.trip }}
          pending={interest.isPending}
          error={interest.error}
          onSend={(note) => send(asking, note)}
          onClose={() => setAsking(null)}
        />
      ) : null}

      {match ? (
        <MatchBurst
          name={match.name}
          photoPath={match.photoUrl}
          onSayHello={() => {
            setMatch(null);
            router.push({ pathname: '/chat/[id]', params: { id: match.conversationId } });
          }}
          onSeeProfile={() => {
            setMatch(null);
            router.push({ pathname: '/user/[id]', params: { id: match.userId } });
          }}
          onClose={() => setMatch(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  // The band already insets its content, so the search drops its own page margins.
  search: { marginHorizontal: 0, marginTop: 0 },
  segments: {
    flexDirection: 'row',
    margin: space.md,
    padding: space.xs,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  notOnMyDates: { marginHorizontal: space.md, marginBottom: space.md },
  // Grows, so a short state (nobody here) sits in the middle of what is left of the screen.
  list: { flexGrow: 1 },
  state: { flexGrow: 1, minHeight: 320 },
  // The space under a card belongs to the card, so it folds away with it (see Leaving).
  item: { marginHorizontal: space.md, marginBottom: space.lg, gap: space.sm },
  statusBar: { position: 'absolute', top: 0, left: 0, right: 0, pointerEvents: 'none' },
});
