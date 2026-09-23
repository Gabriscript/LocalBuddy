import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ApiError } from '@/api/client';
import { useMe } from '@/api/hooks';
import { radius, space, type, useColors } from '@/theme';

import { Button } from './Button';
import { errorMessage } from './Screen';

/// Why a write failed, said where the member was standing when it failed. A mutation that
/// rejects with nothing on screen is indistinguishable from a button that does nothing, which
/// is exactly what an unverified member used to get from the tick on a card.
///
/// Not the full-screen error state: what was already on screen stays, because the feed or the
/// conversation is still perfectly good — one action of it failed.
///
/// `identity_verification_required` is the one refusal that has a fix, so it carries the way
/// out instead of only naming the problem (ADR-0007: nobody reaches another member unverified).
export function ActionError({ error }: { error: unknown }) {
  const c = useColors();
  const router = useRouter();
  const verified = useMe().data?.identityVerified;

  const unverified = error instanceof ApiError && error.code === 'identity_verification_required';
  // Coming back from the check, the refusal that sent you there is no longer true, and a
  // mutation holds its last error until the next attempt. Showing it would be a lie.
  if (!error || (unverified && verified)) return null;

  return (
    <View style={[styles.note, { backgroundColor: c.surfaceMuted, borderColor: c.border }]}>
      <View style={styles.line}>
        {/* The icon repeats what the words say: red alone is not a message (DESIGN.md). */}
        <Ionicons name="alert-circle-outline" size={20} color={c.danger} aria-hidden />
        <Text accessibilityRole="alert" style={[type.body, styles.text, { color: c.text }]}>
          {errorMessage(error)}
        </Text>
      </View>

      {unverified ? (
        <Button
          title="Verify your identity"
          variant="secondary"
          // `from` tells the verify screen it was reached from inside the app rather than as
          // step 2 of onboarding, so it comes back here instead of walking on to step 3.
          onPress={() => router.push({ pathname: '/verify', params: { from: 'app' } })}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  note: {
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  text: { flex: 1 },
});
