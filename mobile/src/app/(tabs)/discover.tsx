import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDecide, useDiscovery, type DiscoveryFilters } from '@/api/hooks';
import { ProfileCard } from '@/components/ProfileCard';
import { Screen } from '@/components/Screen';
import { radius, space, type, useColors } from '@/theme';

const ROLES = [
  { value: undefined, label: 'Everyone' },
  { value: 'host', label: 'Hosts' },
  { value: 'guest', label: 'Guests' },
];

export default function Discover() {
  const c = useColors();
  const router = useRouter();

  // Filters live in the route, not in a store: they are already persisted, already shareable
  // as a deep link, and cost nothing to keep in sync (ADR-0009).
  const params = useLocalSearchParams<{ city?: string; role?: string }>();
  const filters: DiscoveryFilters = { city: params.city, role: params.role };

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
        <Text style={[type.display, { color: c.text }]}>Discover</Text>
        <Text style={[type.body, { color: c.textMuted }]}>
          People near you who want to show you their city.
        </Text>
      </View>

      {/* TODO: the full filter sheet (city, time of day, traits) writes the same route params. */}
      <View style={styles.filters}>
        {ROLES.map((role) => {
          const active = params.role === role.value;
          return (
            <Pressable
              key={role.label}
              onPress={() => router.setParams({ role: role.value })}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: { paddingHorizontal: space.md, paddingTop: space.sm, gap: space.xs },
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
