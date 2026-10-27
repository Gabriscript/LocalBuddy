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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useConversation, useMe, useMessages, useProfile, useSendMessage } from '@/api/hooks';
import { ActionError } from '@/components/ActionError';
import { AuthedImage } from '@/components/AuthedImage';
import { ReviewSheet } from '@/components/ReviewSheet';
import { SafetySheet } from '@/components/SafetySheet';
import { LoadingMore, Screen } from '@/components/Screen';
import { useStrings } from '@/i18n';
import { radius, space, type, useColors } from '@/theme';

export default function Chat() {
  const c = useColors();
  const router = useRouter();
  const s = useStrings();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, isPending, error, refetch, loadMore, isFetchingNextPage } = useMessages(id);
  const send = useSendMessage(id);
  const [draft, setDraft] = useState('');
  const [sheet, setSheet] = useState<'none' | 'safety' | 'review'>('none');

  // Asked for by id, not searched for in the inbox. Scanning the conversation list only ever
  // saw the pages it had loaded, so past the first page the other member came back undefined
  // and the report and block control stayed disabled — in the conversation most likely to
  // need it.
  const { data: conversation } = useConversation(id);
  const otherId = conversation?.otherUserId;
  const { data: other } = useProfile(otherId);
  const { data: me } = useMe();
  const photo = other?.photos?.find((p) => p.type === 'profile')?.url;

  const canSend = draft.trim().length > 0 && !send.isPending;

  function submit() {
    if (!canSend) return;
    send.mutate(draft, { onSuccess: () => setDraft('') });
  }

  return (
    <View style={[styles.page, { backgroundColor: c.background }]}>
      {/* Card from the top edge down, so the status bar sits on the header rather than on Paper. */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + space.sm, backgroundColor: c.surface, borderBottomColor: c.border },
        ]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={s.chat.back}
          hitSlop={8}
          style={styles.iconButton}>
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>

        <Pressable
          onPress={() => otherId && router.push({ pathname: '/user/[id]', params: { id: otherId } })}
          disabled={!otherId}
          accessibilityRole="button"
          accessibilityLabel={other ? s.chat.openProfile(other.name!) : s.chat.conversation}
          style={styles.title}>
          <AuthedImage
            path={photo}
            style={[styles.titleAvatar, { backgroundColor: c.surfaceMuted }]}
          />
          <View style={styles.titleText}>
            <Text style={[type.label, { color: c.text }]} numberOfLines={1}>
              {other?.name ?? s.chat.conversation}
            </Text>
            {other?.city ? (
              <Text style={[type.caption, { color: c.textMuted }]} numberOfLines={1}>
                {other.city}
              </Text>
            ) : null}
          </View>
        </Pressable>

        <Pressable
          onPress={() => setSheet('safety')}
          disabled={!other}
          accessibilityRole="button"
          accessibilityLabel={s.chat.moreActions}
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
          empty={items.length ? undefined : s.chat.empty}
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
              // Tonal, not accented: mine is Card with a hairline, theirs Sunk Paper, and ink
              // stays with the send button. The 6pt corner is the tail, on the sender's side.
              const mine = item.senderId === me?.id;
              return (
                <View
                  accessible
                  aria-label={mine ? s.chat.youSaid(item.content) : s.chat.theySaid(other?.name, item.content)}
                  style={[
                    styles.bubble,
                    mine
                      ? [styles.mine, { backgroundColor: c.surface, borderColor: c.border }]
                      : [styles.theirs, { backgroundColor: c.surfaceMuted }],
                  ]}>
                  <Text style={[type.body, { color: c.text }]}>
                    {item.content}
                  </Text>
                </View>
              );
            }}
          />
        </Screen>

        {/* Above the composer, so it sits with the draft it refused to send rather than
            somewhere up in the conversation. The draft is never cleared on failure. */}
        <ActionError error={send.error} style={styles.note} />

        {/* No bar behind it: a capsule and a circle floating over the bottom inset. */}
        <View style={[styles.composer, { paddingBottom: insets.bottom + space.sm }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={s.chat.message}
            placeholderTextColor={c.textMuted}
            accessibilityLabel={s.chat.message}
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
            accessibilityLabel={s.chat.send}
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
    </View>
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
  titleText: { flex: 1 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 44 },
  titleAvatar: { width: 32, height: 32, borderRadius: radius.pill },
  list: { padding: space.md, gap: space.sm },
  bubble: { maxWidth: '80%', paddingHorizontal: space.md, paddingVertical: space.sm + 2, borderRadius: 18 },
  mine: { alignSelf: 'flex-end', borderBottomRightRadius: 6, borderWidth: StyleSheet.hairlineWidth },
  theirs: { alignSelf: 'flex-start', borderBottomLeftRadius: 6 },
  note: { marginHorizontal: space.sm, marginBottom: space.sm },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingTop: space.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: StyleSheet.hairlineWidth,
    // Half the 44pt height: a capsule on one line, and still rounded when it grows to more.
    borderRadius: 22,
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
