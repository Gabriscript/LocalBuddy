import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMe } from '@/api/hooks';
import { AuthedImage } from '@/components/AuthedImage';
import { Button } from '@/components/Button';
import { Pill } from '@/components/Pill';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/lib/auth';
import { radius, space, type, useColors } from '@/theme';

export default function Me() {
  const c = useColors();
  const { data, isPending, error, refetch } = useMe();
  const { signOut } = useAuth();

  return (
    <SafeAreaView edges={['top']} style={[styles.page, { backgroundColor: c.background }]}>
      <Screen loading={isPending} error={error} onRetry={refetch}>
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.identity}>
            <AuthedImage
              path={data?.photos?.[0]?.url}
              style={[styles.avatar, { backgroundColor: c.surfaceMuted }]}
              accessibilityLabel="Your profile photo"
            />
            <View style={styles.identityText}>
              <Text style={[type.title, { color: c.text }]}>{data?.name}</Text>
              <Text style={[type.body, { color: c.textMuted }]}>{data?.city}</Text>
            </View>
          </View>

          <View style={styles.pills}>
            <Pill
              icon={data?.identityVerified ? 'shield-checkmark-outline' : 'alert-circle-outline'}
              label={data?.identityVerified ? 'Verified' : 'Not verified yet'}
              tone={data?.identityVerified ? 'positive' : 'neutral'}
            />
            <Pill icon="sparkles-outline" label={`${data?.creditsBalance ?? 0} credits`} />
          </View>

          <Button title="Edit profile" variant="secondary" onPress={() => {}} />

          {/* Sign out sits apart from the rest: it is not one more settings row. */}
          <View style={[styles.separated, { borderTopColor: c.border }]}>
            <Button title="Sign out" variant="quiet" onPress={signOut} />
          </View>
        </ScrollView>
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  body: { padding: space.md, gap: space.lg },
  identity: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatar: { width: 88, height: 88, borderRadius: radius.pill },
  identityText: { flex: 1, gap: space.xs },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  separated: { paddingTop: space.lg, borderTopWidth: StyleSheet.hairlineWidth },
});
