import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useConversations } from '@/api/hooks';
import { Screen } from '@/components/Screen';
import { space, type, useColors } from '@/theme';

export default function Chats() {
  const c = useColors();
  const router = useRouter();
  const { data, isPending, error, refetch } = useConversations();

  return (
    <SafeAreaView edges={['top']} style={[styles.page, { backgroundColor: c.background }]}>
      <Text style={[type.display, styles.header, { color: c.text }]}>Chats</Text>

      <Screen
        loading={isPending}
        error={error}
        onRetry={refetch}
        empty={data?.items?.length ? undefined : 'No conversations yet. A chat opens when interest is mutual.'}>
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(conversation) => conversation.id!}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id! } })}
              accessibilityRole="button"
              accessibilityLabel="Open conversation"
              android_ripple={{ color: c.border }}
              style={({ pressed }) => [
                styles.row,
                { borderBottomColor: c.border, backgroundColor: pressed ? c.surfaceMuted : c.background },
              ]}>
              <View style={styles.rowText}>
                <Text style={[type.body, { color: c.text }]} numberOfLines={1}>
                  {item.lastMessage ?? 'Say hello'}
                </Text>
                {item.unlockedByPayment ? (
                  <Text style={[type.caption, { color: c.textMuted }]}>Unlocked</Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={20} color={c.textMuted} />
            </Pressable>
          )}
        />
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: { paddingHorizontal: space.md, paddingVertical: space.sm },
  // 64 keeps the whole row above the 44pt minimum with room for two lines of text.
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: { flex: 1, gap: 2 },
});
