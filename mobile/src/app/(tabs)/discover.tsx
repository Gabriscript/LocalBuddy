import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { components } from '@/api/generated';
import { useDecide, useDiscovery, type DiscoveryFilters } from '@/api/hooks';
import { ActionError } from '@/components/ActionError';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { FilterSheet } from '@/components/FilterSheet';
import { MatchBurst } from '@/components/MatchBurst';
import { ProfileCard } from '@/components/ProfileCard';
import { LoadingMore, Screen } from '@/components/Screen';
import { FeedSkeleton } from '@/components/Skeleton';
import { radius, space, type, useColors } from '@/theme';

const ROLES = [
  { value: undefined, label: 'Everyone' },
  { value: 'host', label: 'Hosts' },
  { value: 'guest', label: 'Guests' },
];

/// Route params are strings; the query takes booleans and a list of numbers.
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
  const router = useRouter();

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
    timeOfDay: params.timeOfDay ? params.timeOfDay.split(',').map(Number) : undefined,
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
  function showInterest(card: Card) {
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
    });
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.page, { backgroundColor: c.background }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text role="heading" style={[type.display, { color: c.text }]}>
            Discover
          </Text>
          <Text style={[type.body, { color: c.textMuted }]}>
            People near you who want to show you their city.
          </Text>
        </View>

        <Pressable
          onPress={() => setFiltering(true)}
          accessibilityRole="button"
          // The count is in the label too: "Filters (2)" read as "Filters" would hide that
          // the feed is already narrowed.
          accessibilityLabel={active ? `Filters, ${active} active` : 'Filters'}
          style={({ pressed }) => [
            styles.filterButton,
            { borderColor: c.border, backgroundColor: c.surfaceMuted, opacity: pressed ? 0.7 : 1 },
          ]}>
          <Ionicons name="options-outline" size={18} color={c.text} aria-hidden />
          <Text style={[type.label, { color: c.text }]}>{active ? `Filters (${active})` : 'Filters'}</Text>
        </Pressable>
      </View>

      <View style={styles.filters} role="radiogroup" aria-label="Who to show">
        {ROLES.map((role) => (
          <Chip
            key={role.label}
            as="radio"
            label={role.label}
            selected={params.role === role.value}
            onPress={() => router.setParams({ role: role.value })}
          />
        ))}
      </View>

      {/* A failed pass or tick belongs next to the card it failed on, not on a screen of its
          own: the feed behind it is still fine. */}
      {interest.error || pass.error ? (
        <View style={styles.note}>
          <ActionError error={interest.error ?? pass.error} />
        </View>
      ) : null}

      <Screen
        loading={isPending}
        skeleton={<FeedSkeleton />}
        error={error}
        onRetry={refetch}
        empty={
          items.length
            ? undefined
            : active
              ? 'Nobody matches these filters right now.'
              : 'Nobody new here right now. Come back later, or look at another city.'
        }
        // Telling somebody to widen their filters without handing them the filters is advice,
        // not a way out.
        emptyAction={
          <Button
            title={active ? 'Change the filters' : 'Open the filters'}
            variant="secondary"
            onPress={() => setFiltering(true)}
          />
        }>
        <FlatList
          data={items}
          keyExtractor={(card) => card.id!}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          // The feed is paged: without this it stopped at the first page and looked finished.
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          ListFooterComponent={<LoadingMore visible={isFetchingNextPage} />}
          renderItem={({ item }) => (
            <ProfileCard
              card={item}
              busy={busy}
              onOpen={() => router.push({ pathname: '/user/[id]', params: { id: item.id! } })}
              onPass={() => pass.mutate(item.id!)}
              onInterest={() => showInterest(item)}
            />
          )}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingTop: space.sm,
  },
  headerText: { flex: 1, gap: space.xs },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    minHeight: 44,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  // Wraps, because at the largest text size three chips no longer fit across a phone and a
  // row that does not wrap simply runs off the side of the screen.
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, padding: space.md },
  note: { paddingHorizontal: space.md, paddingBottom: space.md },
  // The last card clears the tab bar instead of hiding behind it.
  list: { paddingHorizontal: space.md, paddingBottom: space.xxl * 2, gap: space.lg },
});
