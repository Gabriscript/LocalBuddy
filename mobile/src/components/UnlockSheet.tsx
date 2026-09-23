import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ApiError } from '@/api/client';
import { usePaymentOptions, useUnlock } from '@/api/hooks';
import { type, useColors } from '@/theme';

import { Button } from './Button';
import { Sheet } from './Sheet';

/// The only thing LocalBuddy ever charges for: opening a conversation without waiting for the
/// other side (GUIDELINES §2). What it costs comes from the server, because a screen that names
/// a price from a constant of its own eventually names the wrong one.
export function UnlockSheet({
  user,
  onClose,
  onUnlocked,
}: {
  user: { id: string; name: string };
  onClose: () => void;
  onUnlocked: (conversationId: string) => void;
}) {
  const c = useColors();
  const router = useRouter();
  const { data: options } = usePaymentOptions();
  const unlock = useUnlock();

  const credits = Number(options?.credits ?? 0);
  const creditCost = Number(options?.creditCost ?? 1);
  const price = options
    ? new Intl.NumberFormat(undefined, { style: 'currency', currency: options.currency }).format(
        Number(options.unlockPrice)
      )
    : '';

  // The server spends a subscription first, then credits, then money. This says the same thing
  // in the same order, so nobody is surprised by what happened.
  const pays = !options
    ? 'unknown'
    : options.subscribed
      ? 'subscription'
      : credits >= creditCost
        ? 'credits'
        : 'money';

  const cost = {
    unknown: 'Checking what this costs you.',
    subscription: 'Your subscription covers it, with nothing more to pay.',
    credits: `You have ${credits} ${credits === 1 ? 'credit' : 'credits'} from hosting. This uses ${creditCost}.`,
    money: `${price}, once, for this one person.`,
  }[pays];

  const cta = {
    unknown: 'Unlock the chat',
    subscription: 'Open the chat',
    credits: `Use ${creditCost === 1 ? '1 credit' : `${creditCost} credits`}`,
    money: `Pay ${price}`,
  }[pays];

  const unverified =
    unlock.error instanceof ApiError && unlock.error.code === 'identity_verification_required';

  return (
    <Sheet
      title="Unlock the chat"
      onClose={onClose}
      footer={
        <View style={styles.grow}>
          {unverified ? (
            <Button
              title="Verify your identity"
              // `from` keeps the verify screen out of its onboarding costume: no "Step 2 of 5"
              // dots, and it comes back to this profile instead of walking on to step 3.
              onPress={() => router.push({ pathname: '/verify', params: { from: 'app' } })}
            />
          ) : (
            <Button
              title={cta}
              loading={unlock.isPending}
              disabled={!options}
              onPress={() =>
                unlock.mutate(user.id, { onSuccess: (result) => onUnlocked(result.conversationId) })
              }
            />
          )}
        </View>
      }>
      <Text style={[type.body, { color: c.text }]}>
        This opens a conversation with {user.name} straight away, instead of waiting for them to
        show interest back.
      </Text>

      <Text style={[type.label, { color: c.text }]}>{cost}</Text>

      <Text style={[type.caption, { color: c.textMuted }]}>
        It pays for the introduction, and for nothing else. The time you spend together is never
        paid for, by either of you.
      </Text>

      {unlock.error ? (
        <Text accessibilityRole="alert" style={[type.body, { color: c.danger }]}>
          {unlock.error.message}
        </Text>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
});
