import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBlock, useBlocks } from '@/api/hooks';
import { AuthedImage } from '@/components/AuthedImage';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { radius, space, type, useColors } from '@/theme';

/// The only screen a blocked member still appears on. Everywhere else they are gone, which is
/// the point of a block and also the reason this list has to exist.
export default function Blocked() {
  const c = useColors();
  const router = useRouter();
  const { data, isPending, error, refetch } = useBlocks();
  const { unblock } = useBlock();

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: c.background }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/me'))}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          style={styles.iconButton}>
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text role="heading" style={[type.title, { color: c.text }]}>
          Blocked members
        </Text>
      </View>

      <Screen
        loading={isPending}
        error={error}
        onRetry={refetch}
        empty={
          data?.items?.length
            ? undefined
            : 'Nobody is blocked. Blocking hides two people from each other, and this is where it can be undone.'
        }>
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(member) => member.id!}
          renderItem={({ item }) => (
            <View style={[styles.row, { borderBottomColor: c.border }]}>
              <AuthedImage
                path={item.photoUrl}
                style={[styles.avatar, { backgroundColor: c.surfaceMuted }]}
              />
              <View style={styles.rowText}>
                <Text style={[type.label, { color: c.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[type.caption, { color: c.textMuted }]} numberOfLines={1}>
                  {item.city}
                </Text>
              </View>
              <Button
                title="Unblock"
                variant="secondary"
                loading={unblock.isPending && unblock.variables === item.id}
                onPress={() => unblock.mutate(item.id!)}
              />
            </View>
          )}
        />
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingRight: space.md,
    paddingBottom: space.sm,
  },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
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
