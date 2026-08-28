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

import { useMessages, useSendMessage } from '@/api/hooks';
import { Screen } from '@/components/Screen';
import { radius, space, type, useColors } from '@/theme';

export default function Chat() {
  const c = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isPending, error, refetch } = useMessages(id);
  const send = useSendMessage(id);
  const [draft, setDraft] = useState('');

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
          style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text style={[type.label, { color: c.text }]}>Conversation</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.page}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Screen
          loading={isPending}
          error={error}
          onRetry={refetch}
          empty={data?.items?.length ? undefined : 'No messages yet. Say hello.'}>
          <FlatList
            data={data?.items ?? []}
            keyExtractor={(m) => m.id!}
            inverted
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={[styles.bubble, { backgroundColor: c.surfaceMuted }]}>
                <Text style={[type.body, { color: c.text }]}>{item.content}</Text>
              </View>
            )}
          />
        </Screen>

        <View style={[styles.composer, { borderTopColor: c.border, backgroundColor: c.surface }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message"
            placeholderTextColor={c.textMuted}
            accessibilityLabel="Message"
            multiline
            style={[type.body, styles.input, { color: c.text, backgroundColor: c.surfaceMuted, borderColor: c.border }]}
          />
          <Pressable
            onPress={submit}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{ disabled: !canSend }}
            style={({ pressed }) => [
              styles.send,
              { backgroundColor: c.primary, opacity: !canSend ? 0.45 : pressed ? 0.75 : 1 },
            ]}>
            <Ionicons name="arrow-up" size={22} color={c.onPrimary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  list: { padding: space.md, gap: space.sm },
  bubble: { alignSelf: 'flex-start', maxWidth: '80%', padding: space.md, borderRadius: radius.lg },
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
  send: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
