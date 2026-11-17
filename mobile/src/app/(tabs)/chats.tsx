import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/generated';
import { useConversations, useProfile, useRequestCount, useRequests, useSentRequests } from '@/api/hooks';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
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
  const router = useRouter();
  const s = useStrings();
  const { items, isPending, error, refetch, isRefetching, loadMore, isFetchingNextPage } =
    useConversations();
  const requests = useRequests();
  const requestCount = useRequestCount();
  const sent = useSentRequests();

  return (
    <View style={[styles.page, { backgroundColor: c.background }]}>
      <TabHeader title={s.chats.title} />
      <RequestCard cards={requests.items} count={requestCount.data ?? 0} />
      <Waiting cards={sent.items} />

      <Screen
        loading={isPending}
        skeleton={<ChatListSkeleton />}
        error={error}
        onRetry={refetch}
        empty={items.length ? undefined : s.chats.empty}
        emptyIcon="chatbubble-outline"
        // An empty inbox on day one is the normal state, so it hands over the next step.
        emptyAction={
          <Button title={s.chats.findSomeone} variant="secondary" onPress={() => router.navigate('/discover')} />
        }>
        <FlatList
          data={items}
          keyExtractor={(conversation) => conversation.id!}
          contentContainerStyle={{ paddingBottom: clearance }}
          // The inbox is the one list people come back to expecting it to have changed.
          onRefresh={() => {
            refetch();
            requests.refetch();
            requestCount.refetch();
            sent.refetch();
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

const FACES = 3;

/// Who is waiting for an answer, as one card above the inbox: their faces, a sentence that says
/// what they want, and their first names. Nothing at all when nobody is: the empty state
/// belongs to the requests screen. One control, so a screen reader hears it once, in full.
function RequestCard({ cards, count }: { cards: Card[]; count: number }) {
  const c = useColors();
  const router = useRouter();
  const s = useStrings();
  if (!count || !cards.length) return null;

  const shown = cards.slice(0, FACES);
  // The count can be larger than the faces: the rest are said, or "4 people" named only three.
  const more = count - shown.length;
  const names = [
    shown.map((card) => card.name?.split(' ')[0]).filter(Boolean).join(', '),
    more > 0 ? s.requests.andMore(more) : null,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <Pressable
      onPress={() => router.push('/requests')}
      accessibilityRole="button"
      accessibilityLabel={`${s.requests.title}, ${s.requests.waiting(count)}, ${names}`}
      android_ripple={{ color: c.border }}
      style={({ pressed }) => [
        styles.requests,
        { backgroundColor: pressed ? c.surfaceMuted : c.surface, borderColor: c.border },
      ]}>
      {/* Overlapping, each ringed in the card's own colour so the faces stay apart. */}
      <View style={styles.faces} aria-hidden>
        {shown.map((card, index) => (
          <Avatar
            key={card.id}
            path={card.photoUrl}
            size={44}
            photoSize="thumb"
            aria-hidden
            style={[
              styles.face,
              { backgroundColor: c.surfaceMuted, borderColor: c.surface, marginLeft: index ? -14 : 0 },
            ]}
          />
        ))}
      </View>
      <View style={styles.rowText}>
        <Text style={[type.caption, { color: c.textMuted }]}>{s.requests.title}</Text>
        <Text style={[type.label, { color: c.text }]}>{s.requests.waiting(count)}</Text>
        <Text style={[type.caption, { color: c.textMuted }]} numberOfLines={1}>
          {names}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={c.textMuted} aria-hidden />
    </Pressable>
  );
}

/// Who I asked and have no yes from yet, as a row of faces: the proof that a request went, for
/// as long as it is unanswered. Each face opens that person's profile. Nothing when nobody is.
function Waiting({ cards }: { cards: Card[] }) {
  const c = useColors();
  const router = useRouter();
  const s = useStrings();
  if (!cards.length) return null;

  return (
    <View style={styles.waiting}>
      <Text role="heading" style={[type.caption, styles.waitingHead, { color: c.textMuted }]}>
        {s.chats.waiting}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.waitingFaces}>
        {cards.map((card) => (
          <Pressable
            key={card.id}
            onPress={() => router.push({ pathname: '/user/[id]', params: { id: card.id! } })}
            accessibilityRole="button"
            accessibilityLabel={card.name ?? ''}
            style={({ pressed }) => [styles.waitingFace, { opacity: pressed ? 0.7 : 1 }]}>
            <Avatar path={card.photoUrl} size={48} photoSize="thumb" aria-hidden style={{ backgroundColor: c.surfaceMuted }} />
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
  // The generated type allows a string for an int32; the server always sends a number.
  const unread = Number(conversation.unreadCount ?? 0);

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
      <Avatar path={photo} size={48} photoSize="thumb" aria-hidden style={{ backgroundColor: c.surfaceMuted }} />

      <View style={styles.rowText}>
        <Text style={[type.label, { color: c.text }]} numberOfLines={1}>
          {other?.name ?? ' '}
        </Text>
        <Text style={[type.caption, { color: unread ? c.text : c.textMuted }]} numberOfLines={1}>
          {conversation.lastMessage ?? s.chats.sayHello}
        </Text>
        {conversation.unlockedByPayment ? (
          <Text style={[type.caption, { color: c.textMuted }]}>{s.chats.unlocked}</Text>
        ) : null}
      </View>

      {unread ? (
        <View style={[styles.unread, { backgroundColor: c.primary }]}>
          <Text
            accessibilityLabel={s.chats.unread(unread)}
            style={[type.caption, styles.figure, { color: c.onPrimary }]}>
            {unread > 9 ? '9+' : unread}
          </Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={20} color={c.textMuted} aria-hidden />
      )}
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
  requests: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    margin: space.md,
    marginBottom: space.sm,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  figure: { fontVariant: ['tabular-nums'] },
  faces: { flexDirection: 'row' },
  waiting: { paddingTop: space.sm, paddingBottom: space.md, gap: space.sm },
  waitingHead: { paddingHorizontal: space.md },
  waitingFaces: { paddingHorizontal: space.md, gap: space.md },
  waitingFace: { width: 56, alignItems: 'center', gap: space.xs },
  face: { borderWidth: 2 },
  rowText: { flex: 1, gap: 2 },
  unread: { minWidth: 24, height: 24, paddingHorizontal: 6, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
