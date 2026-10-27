import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/generated';
import { useDecide, useDiscovery, type DiscoveryFilters } from '@/api/hooks';
import type { TimeOfDay } from '@/api/labels';
import { ActionError } from '@/components/ActionError';
import { Button } from '@/components/Button';
import { FilterSheet } from '@/components/FilterSheet';
import { IconButton } from '@/components/IconButton';
import { MatchBurst } from '@/components/MatchBurst';
import { ProfileCard } from '@/components/ProfileCard';
import { LoadingMore, Screen } from '@/components/Screen';
import { FeedSkeleton } from '@/components/Skeleton';
import { useTabBarClearance } from '@/components/TabBar';
import { TabHeader } from '@/components/TabHeader';
import { useStrings } from '@/i18n';
import { radius, space, type, useColors } from '@/theme';

/// Route params are strings; the query takes booleans and a list of times of day.
type Params = {
  city?: string;
  role?: string;
  offersOvernight?: string;
  timeOfDay?: string;
  hasCar?: string;
  smokes?: string;
  hasPets?: string;
};

type Card = components['schemas']['ProfileCard'];
type Match = { userId: string; name: string; photoUrl?: string | null; conversationId: string };

const asBool = (value?: string) => (value === undefined ? undefined : value === 'true');
const asParam = (value?: boolean) => (value === undefined ? undefined : String(value));

export default function Discover() {
  const c = useColors();
  const clearance = useTabBarClearance();
  const router = useRouter();
  const s = useStrings();
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
    hasCar: asBool(params.hasCar),
    smokes: asBool(params.smokes),
    hasPets: asBool(params.hasPets),
    // One comma-separated param rather than a repeated one: shorter link, one thing to parse.
    timeOfDay: params.timeOfDay ? (params.timeOfDay.split(',') as TimeOfDay[]) : undefined,
  };

  const [filtering, setFiltering] = useState(false);
  // Role is not counted: it has its own chips right there, in view.
  const active = [
    filters.city,
    filters.offersOvernight,
    filters.hasCar,
    filters.smokes,
    filters.hasPets,
    filters.timeOfDay,
  ].filter((value) => value !== undefined).length;

  function applyFilters(next: DiscoveryFilters) {
    setFiltering(false);
    // Every key the sheet owns, including the cleared ones: setParams merges, so a key left
    // out would keep its old value. Role is left out on purpose, and survives.
    router.setParams({
      city: next.city?.trim() || undefined,
      offersOvernight: next.offersOvernight ? 'true' : undefined,
      timeOfDay: next.timeOfDay?.length ? next.timeOfDay.join(',') : undefined,
      hasCar: asParam(next.hasCar),
      smokes: asParam(next.smokes),
      hasPets: asParam(next.hasPets),
    });
  }

  const { items, isPending, error, refetch, isRefetching, loadMore, isFetchingNextPage } =
    useDiscovery(filters);
  const { interest, pass } = useDecide();
  const busy = interest.isPending || pass.isPending;

  // A reciprocal match is the moment the whole product exists for, so it gets a moment of its
  // own instead of a silent navigation. Anything else: the card simply goes.
  const [match, setMatch] = useState<Match | null>(null);

  /// `mutate`, not `mutateAsync`: a refusal from the server is a rejected promise nobody
  /// awaits, and an unverified member got a tick that silently did nothing. This way the
  /// refusal lands in `interest.error`, where the screen can say it out loud.
  ///
  /// These three are stable across renders so that the `memo` on ProfileCard can do its job.
  const showInterest = useCallback(
    (card: Card) =>
      interest.mutate(card.id!, {
        onSuccess: (result) => {
          if (result.matched && result.conversationId) {
            setMatch({
              userId: card.id!,
              name: card.name!,
              photoUrl: card.photoUrl,
              conversationId: result.conversationId,
            });
          }
        },
      }),
    [interest]
  );

  const showProfile = useCallback(
    (card: Card) => router.push({ pathname: '/user/[id]', params: { id: card.id! } }),
    [router]
  );

  const passOn = useCallback((card: Card) => pass.mutate(card.id!), [pass]);

  const renderCard = useCallback(
    ({ item }: { item: Card }) => (
      <ProfileCard
        card={item}
        busy={busy}
        onOpen={showProfile}
        onPass={passOn}
        onInterest={showInterest}
      />
    ),
    [busy, showProfile, passOn, showInterest]
  );

  return (
    <View style={[styles.page, { backgroundColor: c.background }]}>
      <TabHeader
        title={s.discover.title}
        subtitle={s.discover.subtitle}
        action={
          <IconButton
            name="options-outline"
            // The count is in the label too: a badge read as "Filters" would hide that the feed
            // is already narrowed.
            label={active ? s.discover.filtersLabel(active) : s.discover.filters}
            onPress={() => setFiltering(true)}
            tint={c.onNight}
            band
            badge={active}
          />
        }
      />

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

      {/* A failed pass or tick belongs next to the card it failed on, not on a screen of its
          own: the feed behind it is still fine. No wrapper — it carries its own inset and
          disappears completely when there is nothing to say. */}
      <ActionError error={interest.error ?? pass.error} style={styles.note} />

      <Screen
        loading={isPending}
        skeleton={<FeedSkeleton />}
        error={error}
        onRetry={refetch}
        empty={
          items.length
            ? undefined
            : active
              ? s.discover.emptyFiltered
              : s.discover.empty
        }
        // Telling somebody to widen their filters without handing them the filters is advice,
        // not a way out.
        emptyAction={
          <Button
            title={active ? s.discover.changeFilters : s.discover.openFilters}
            variant="secondary"
            onPress={() => setFiltering(true)}
          />
        }>
        <FlatList
          data={items}
          keyExtractor={(card) => card.id!}
          // The last card clears the floating tab bar instead of hiding behind it.
          contentContainerStyle={[styles.list, { paddingBottom: clearance }]}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          // The feed is paged: without this it stopped at the first page and looked finished.
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          ListFooterComponent={<LoadingMore visible={isFetchingNextPage} />}
          renderItem={renderCard}
        />
      </Screen>

      {filtering ? (
        <FilterSheet value={filters} onClose={() => setFiltering(false)} onApply={applyFilters} />
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
  note: { marginHorizontal: space.md, marginBottom: space.md },
  list: { paddingHorizontal: space.md, gap: space.lg },
});
