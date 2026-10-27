import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { components } from '@/api/generated';
import { useDecide, useRequests } from '@/api/hooks';
import { ActionError } from '@/components/ActionError';
import { MatchBurst } from '@/components/MatchBurst';
import { ProfileCard } from '@/components/ProfileCard';
import { LoadingMore, Screen } from '@/components/Screen';
import { FeedSkeleton } from '@/components/Skeleton';
import { useStrings } from '@/i18n';
import { space, type, useColors } from '@/theme';

type Card = components['schemas']['ProfileCard'];
type Match = { userId: string; name: string; photoUrl?: string | null; conversationId: string };

/// People who said they would like to meet you. The same cards and the same two decisions as
/// the feed: the tick is an interest back, which is always a match here, and the cross is a pass
/// the other person never hears about.
export default function Requests() {
  const c = useColors();
  const router = useRouter();
  const s = useStrings();
  const { items, isPending, error, refetch, isRefetching, loadMore, isFetchingNextPage } = useRequests();
  const { interest, pass } = useDecide();
  const busy = interest.isPending || pass.isPending;
  const [match, setMatch] = useState<Match | null>(null);

  // Stable across renders, so the `memo` on ProfileCard can skip the rows (see Discover).
  const accept = useCallback(
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
  const decline = useCallback((card: Card) => pass.mutate(card.id!), [pass]);
  const showProfile = useCallback(
    (card: Card) => router.push({ pathname: '/user/[id]', params: { id: card.id! } }),
    [router]
  );

  const renderCard = useCallback(
    ({ item }: { item: Card }) => (
      <ProfileCard card={item} busy={busy} onOpen={showProfile} onPass={decline} onInterest={accept} />
    ),
    [busy, showProfile, decline, accept]
  );

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: c.background }]}>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/chats'))}
        accessibilityRole="button"
        accessibilityLabel={s.common.goBack}
        hitSlop={8}
        style={styles.iconButton}>
        <Ionicons name="chevron-back" size={24} color={c.text} />
      </Pressable>
      <View style={styles.header}>
        <Text role="heading" style={[type.display, { color: c.text }]}>
          {s.requests.title}
        </Text>
        <Text style={[type.body, { color: c.textMuted }]}>{s.requests.subtitle}</Text>
      </View>

      <ActionError error={interest.error ?? pass.error} style={styles.note} />

      <Screen
        loading={isPending}
        skeleton={<FeedSkeleton />}
        error={error}
        onRetry={refetch}
        empty={items.length ? undefined : s.requests.empty}
        emptyIcon="people-outline">
        <FlatList
          data={items}
          keyExtractor={(card) => card.id!}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          ListFooterComponent={<LoadingMore visible={isFetchingNextPage} />}
          renderItem={renderCard}
        />
      </Screen>

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
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: space.md, paddingBottom: space.md, gap: space.xs },
  note: { marginHorizontal: space.md, marginBottom: space.md },
  list: { paddingHorizontal: space.md, paddingBottom: space.lg, gap: space.lg },
});
