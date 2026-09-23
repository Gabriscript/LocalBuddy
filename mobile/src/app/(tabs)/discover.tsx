import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDecide, useDiscovery, type DiscoveryFilters } from '@/api/hooks';
import { FilterSheet } from '@/components/FilterSheet';
import { ProfileCard } from '@/components/ProfileCard';
import { Screen } from '@/components/Screen';
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

  const { data, isPending, error, refetch, isRefetching } = useDiscovery(filters);
  const { interest, pass } = useDecide();
  const busy = interest.isPending || pass.isPending;

  async function showInterest(id: string) {
    const result = await interest.mutateAsync(id);
    // A reciprocal match opens the conversation straight away; otherwise the card just goes.
    if (result.matched && result.conversationId) {
      router.push({ pathname: '/chat/[id]', params: { id: result.conversationId } });
    }
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
        {ROLES.map((role) => {
          const active = params.role === role.value;
          return (
            <Pressable
              key={role.label}
              onPress={() => router.setParams({ role: role.value })}
              role="radio"
              aria-checked={active}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: active ? c.text : c.surfaceMuted,
                  borderColor: active ? c.text : c.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <Text style={[type.label, { color: active ? c.background : c.text }]}>{role.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Screen
        loading={isPending}
        skeleton={<FeedSkeleton />}
        error={error}
        onRetry={refetch}
        empty={data?.items?.length ? undefined : 'Nobody new here right now. Try widening your filters.'}>
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(card) => card.id!}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          renderItem={({ item }) => (
            <ProfileCard
              card={item}
              busy={busy}
              onOpen={() => router.push({ pathname: '/user/[id]', params: { id: item.id! } })}
              onPass={() => pass.mutate(item.id!)}
              onInterest={() => showInterest(item.id!)}
            />
          )}
        />
      </Screen>

      {filtering ? (
        <FilterSheet value={filters} onClose={() => setFiltering(false)} onApply={applyFilters} />
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
  filters: { flexDirection: 'row', gap: space.sm, padding: space.md },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  // The last card clears the tab bar instead of hiding behind it.
  list: { paddingHorizontal: space.md, paddingBottom: space.xxl * 2, gap: space.lg },
});
