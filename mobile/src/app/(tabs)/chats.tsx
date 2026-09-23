import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { components } from '@/api/generated';
import { useConversations, useProfile } from '@/api/hooks';
import { AuthedImage } from '@/components/AuthedImage';
import { LoadingMore, Screen } from '@/components/Screen';
import { ChatListSkeleton } from '@/components/Skeleton';
import { radius, space, type, useColors } from '@/theme';

type Conversation = components['schemas']['ConversationSummary'];

export default function Chats() {
  const c = useColors();
  const { items, isPending, error, refetch, isRefetching, loadMore, isFetchingNextPage } =
    useConversations();

  return (
    <SafeAreaView edges={['top']} style={[styles.page, { backgroundColor: c.background }]}>
      <Text role="heading" style={[type.display, styles.header, { color: c.text }]}>
        Chats
      </Text>

      <Screen
        loading={isPending}
        skeleton={<ChatListSkeleton />}
        error={error}
        onRetry={refetch}
        empty={items.length ? undefined : 'No conversations yet. A chat opens when interest is mutual.'}
        emptyIcon="chatbubble-outline">
        <FlatList
          data={items}
          keyExtractor={(conversation) => conversation.id!}
          // The inbox is the one list people come back to expecting it to have changed.
          onRefresh={refetch}
          refreshing={isRefetching}
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          ListFooterComponent={<LoadingMore visible={isFetchingNextPage} />}
          renderItem={({ item }) => <ChatRow conversation={item} />}
        />
      </Screen>
    </SafeAreaView>
  );
}

/// One request per row for the other member's name and face. The list is short by nature, and
/// the profiles are the same ones the chat screen and the feed already cache.
function ChatRow({ conversation }: { conversation: Conversation }) {
  const c = useColors();
  const router = useRouter();
  const { data: other } = useProfile(conversation.otherUserId);
  const photo = other?.photos?.find((p) => p.type === 0)?.url;

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
          {conversation.lastMessage ?? 'Say hello'}
        </Text>
        {conversation.unlockedByPayment ? (
          <Text style={[type.caption, { color: c.textMuted }]}>Unlocked</Text>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={20} color={c.textMuted} aria-hidden />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: { paddingHorizontal: space.md, paddingVertical: space.sm },
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
  rowText: { flex: 1, gap: 2 },
});
