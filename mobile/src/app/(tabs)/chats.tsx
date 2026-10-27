import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/generated';
import { useConversations, useProfile, useRequestCount, useRequests } from '@/api/hooks';
import { AuthedImage } from '@/components/AuthedImage';
import { LoadingMore, Screen } from '@/components/Screen';
import { ChatListSkeleton } from '@/components/Skeleton';
import { useTabBarClearance } from '@/components/TabBar';
import { TabHeader } from '@/components/TabHeader';
import { useStrings } from '@/i18n';
import { radius, space, type, useColors } from '@/theme';

type Conversation = components['schemas']['ConversationSummary'];
type Card = components['schemas']['ProfileCard'];

export default function Chats() {
  const c = useColors();
  const clearance = useTabBarClearance();
  const s = useStrings();
  const { items, isPending, error, refetch, isRefetching, loadMore, isFetchingNextPage } =
    useConversations();
  const requests = useRequests();
  const requestCount = useRequestCount();

  return (
    <View style={[styles.page, { backgroundColor: c.background }]}>
      <TabHeader title={s.chats.title} />
      <RequestStrip cards={requests.items} count={requestCount.data ?? 0} />

      <Screen
        loading={isPending}
        skeleton={<ChatListSkeleton />}
        error={error}
        onRetry={refetch}
        empty={items.length ? undefined : s.chats.empty}
        emptyIcon="chatbubble-outline">
        <FlatList
          data={items}
          keyExtractor={(conversation) => conversation.id!}
          contentContainerStyle={{ paddingBottom: clearance }}
          // The inbox is the one list people come back to expecting it to have changed.
          onRefresh={() => {
            refetch();
            requests.refetch();
            requestCount.refetch();
          }}
          refreshing={isRefetching}
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          ListFooterComponent={<LoadingMore visible={isFetchingNextPage} />}
          renderItem={({ item }) => <ChatRow conversation={item} />}
        />
      </Screen>
    </View>
  );
}

const STRIP = 8;

/// Who is waiting for an answer, as a row of faces above the inbox. Nothing at all when nobody
/// is: the empty state belongs to the requests screen. The header is the one control for
/// assistive technology; the faces are a bigger target for the same place.
function RequestStrip({ cards, count }: { cards: Card[]; count: number }) {
  const c = useColors();
  const router = useRouter();
  const s = useStrings();
  if (!count || !cards.length) return null;

  const open = () => router.push('/requests');
  return (
    <View style={[styles.requests, { borderBottomColor: c.border }]}>
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={`${s.requests.title}, ${s.requests.count(count)}`}
        style={({ pressed }) => [styles.requestsHead, { opacity: pressed ? 0.7 : 1 }]}>
        <Text style={[type.label, { color: c.text }]}>{s.requests.title}</Text>
        <Text style={[type.label, styles.figure, { color: c.textMuted }]}>{count}</Text>
      </Pressable>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.faces}>
        {cards.slice(0, STRIP).map((card) => (
          <Pressable
            key={card.id}
            onPress={open}
            aria-hidden
            focusable={false}
            style={({ pressed }) => [styles.face, { opacity: pressed ? 0.7 : 1 }]}>
            <AuthedImage
              path={card.photoUrl}
              aria-hidden
              style={[styles.facePhoto, { backgroundColor: c.surfaceMuted, borderColor: c.border }]}
            />
            <Text style={[type.caption, { color: c.textMuted }]} numberOfLines={1}>
              {card.name?.split(' ')[0]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

/// One request per row for the other member's name and face. The list is short by nature, and
/// the profiles are the same ones the chat screen and the feed already cache.
function ChatRow({ conversation }: { conversation: Conversation }) {
  const c = useColors();
  const router = useRouter();
  const s = useStrings();
  const { data: other } = useProfile(conversation.otherUserId);
  const photo = other?.photos?.find((p) => p.type === 'profile')?.url;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/chat/[id]', params: { id: conversation.id! } })}
      accessibilityRole="button"
      // No fixed label: the row reads out the name and the last message, so each conversation
      // sounds different instead of every row being "Open conversation".
      android_ripple={{ color: c.border }}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: c.border, backgroundColor: pressed ? c.surfaceMuted : c.background },
      ]}>
      {/* Decorative: the row reads out its children, and the name follows immediately. Without
          this the face is announced as an image with no name at all. */}
      <AuthedImage
        path={photo}
        aria-hidden
        style={[styles.avatar, { backgroundColor: c.surfaceMuted }]}
      />

      <View style={styles.rowText}>
        <Text style={[type.label, { color: c.text }]} numberOfLines={1}>
          {other?.name ?? ' '}
        </Text>
        <Text style={[type.caption, { color: c.textMuted }]} numberOfLines={1}>
          {conversation.lastMessage ?? s.chats.sayHello}
        </Text>
        {conversation.unlockedByPayment ? (
          <Text style={[type.caption, { color: c.textMuted }]}>{s.chats.unlocked}</Text>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={20} color={c.textMuted} aria-hidden />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  // 72 keeps the whole row above the 44pt minimum with room for the face and two lines.
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: { width: 48, height: 48, borderRadius: radius.pill },
  requests: { paddingVertical: space.md, gap: space.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  requestsHead: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
  },
  figure: { fontVariant: ['tabular-nums'] },
  faces: { paddingHorizontal: space.md, gap: space.md },
  face: { width: 56, alignItems: 'center', gap: space.xs },
  facePhoto: { width: 56, height: 56, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth },
  rowText: { flex: 1, gap: 2 },
});
