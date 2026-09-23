import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useConversations, useMe, useMessages, useProfile, useSendMessage } from '@/api/hooks';
import { ActionError } from '@/components/ActionError';
import { AuthedImage } from '@/components/AuthedImage';
import { ReviewSheet } from '@/components/ReviewSheet';
import { SafetySheet } from '@/components/SafetySheet';
import { LoadingMore, Screen } from '@/components/Screen';
import { radius, space, type, useColors } from '@/theme';

export default function Chat() {
  const c = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, isPending, error, refetch, loadMore, isFetchingNextPage } = useMessages(id);
  const send = useSendMessage(id);
  const [draft, setDraft] = useState('');
  const [sheet, setSheet] = useState<'none' | 'safety' | 'review'>('none');

  // The conversation list is where the other member's id lives. It is cached by the time
  // anyone taps through to here, and fetched once on a cold deep link.
  const { items: conversations } = useConversations();
  const otherId = conversations.find((conversation) => conversation.id === id)?.otherUserId;
  const { data: other } = useProfile(otherId);
  const { data: me } = useMe();
  const photo = other?.photos?.find((p) => p.type === 0)?.url;

  const canSend = draft.trim().length > 0 && !send.isPending;

  function submit() {
    if (!canSend) return;
    send.mutate(draft, { onSuccess: () => setDraft('') });
  }

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: c.background }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back to chats"
          hitSlop={8}
          style={styles.iconButton}>
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>

        <Pressable
          onPress={() => otherId && router.push({ pathname: '/user/[id]', params: { id: otherId } })}
          disabled={!otherId}
          accessibilityRole="button"
          accessibilityLabel={other ? `${other.name}, open their profile` : 'Conversation'}
          style={styles.title}>
          <AuthedImage
            path={photo}
            style={[styles.titleAvatar, { backgroundColor: c.surfaceMuted }]}
          />
          <Text style={[type.label, { color: c.text }]} numberOfLines={1}>
            {other?.name ?? 'Conversation'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setSheet('safety')}
          disabled={!other}
          accessibilityRole="button"
          accessibilityLabel="Review, report or block"
          hitSlop={8}
          style={styles.iconButton}>
          <Ionicons name="ellipsis-horizontal" size={22} color={c.text} aria-hidden />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.page}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Screen
          loading={isPending}
          error={error}
          onRetry={refetch}
          empty={items.length ? undefined : 'No messages yet. Say hello.'}
          emptyIcon="chatbubble-outline">
          <FlatList
            data={items}
            keyExtractor={(m) => m.id!}
            inverted
            contentContainerStyle={styles.list}
            // Page 0 is the newest and the list is inverted, so the end of the data sits at the
            // top of the screen — exactly where somebody scrolls to read back through a
            // conversation. Without this the chat stopped at its most recent page.
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            ListFooterComponent={<LoadingMore visible={isFetchingNextPage} />}
            renderItem={({ item }) => {
              // Tonal, not accented: the dark bubble is mine, the paper one is theirs, and ink
              // stays with the actions.
              const mine = item.senderId === me?.id;
              return (
                <View
                  accessible
                  aria-label={`${mine ? 'You' : (other?.name ?? 'They')} said: ${item.content}`}
                  style={[
                    styles.bubble,
                    mine
                      ? { alignSelf: 'flex-end', backgroundColor: c.text }
                      : { alignSelf: 'flex-start', backgroundColor: c.surfaceMuted },
                  ]}>
                  <Text style={[type.body, { color: mine ? c.background : c.text }]}>
                    {item.content}
                  </Text>
                </View>
              );
            }}
          />
        </Screen>

        {/* Above the composer, so it sits with the draft it refused to send rather than
            somewhere up in the conversation. The draft is never cleared on failure. */}
        {send.error ? (
          <View style={styles.note}>
            <ActionError error={send.error} />
          </View>
        ) : null}

        <View style={[styles.composer, { borderTopColor: c.border, backgroundColor: c.surface }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message"
            placeholderTextColor={c.textMuted}
            accessibilityLabel="Message"
            multiline
            style={[
              type.body,
              styles.input,
              { color: c.text, backgroundColor: c.surfaceMuted, borderColor: c.border },
            ]}
          />
          <Pressable
            onPress={submit}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            style={({ pressed }) => [
              styles.send,
              { backgroundColor: c.primary, opacity: !canSend ? 0.45 : pressed ? 0.75 : 1 },
            ]}>
            <Ionicons name="arrow-up" size={22} color={c.onPrimary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {sheet === 'safety' && other ? (
        <SafetySheet
          user={{ id: other.id!, name: other.name! }}
          onClose={() => setSheet('none')}
          // The conversation closes with the block, so there is nothing to come back to.
          onBlocked={() => router.replace('/chats')}
          onReview={() => setSheet('review')}
        />
      ) : null}

      {sheet === 'review' && other ? (
        <ReviewSheet user={{ id: other.id!, name: other.name! }} onClose={() => setSheet('none')} />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.sm,
    paddingBottom: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 44 },
  titleAvatar: { width: 32, height: 32, borderRadius: radius.pill },
  list: { padding: space.md, gap: space.sm },
  bubble: { maxWidth: '80%', padding: space.md, borderRadius: radius.lg },
  note: { paddingHorizontal: space.sm, paddingBottom: space.sm },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.sm,
    padding: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    paddingHorizontal: space.md,
    paddingTop: space.sm + 2,
    paddingBottom: space.sm + 2,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
