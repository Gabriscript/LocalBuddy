import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ApiError } from '@/api/client';
import { useMe, usePaymentOptions, useUnlock } from '@/api/hooks';
import { useLanguage, useStrings } from '@/i18n';
import { type, useColors } from '@/theme';

import { Button } from './Button';
import { errorMessage } from './Screen';
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
  const s = useStrings();
  const { language } = useLanguage();
  const { data: options } = usePaymentOptions();
  const unlock = useUnlock();

  const price = options
    ? new Intl.NumberFormat(language, { style: 'currency', currency: options.currency }).format(
        Number(options.unlockPrice)
      )
    : '';

  // A subscription first, then money, as the server spends them. Credits are leaving the app and
  // are no longer offered here. shortcut: the server still spends credits before money, so a
  // member who has some is shown a price that their credits pay; goes once the server drops them.
  const pays = !options ? 'unknown' : options.subscribed ? 'subscription' : 'money';

  const cost = {
    unknown: s.unlock.checking,
    subscription: s.unlock.subscription,
    money: s.unlock.money(price),
  }[pays];

  const cta = {
    unknown: s.unlock.title,
    subscription: s.unlock.ctaSubscription,
    money: s.unlock.ctaMoney(price),
  }[pays];

  const pending = !!useMe().data?.identityVerificationPending;
  const unverified =
    unlock.error instanceof ApiError && unlock.error.code === 'identity_verification_required';

  return (
    <Sheet
      title={s.unlock.title}
      onClose={onClose}
      footer={
        <View style={styles.grow}>
          {unverified ? (
            <Button
              title={pending ? s.common.waitingApproval : s.common.verifyIdentity}
              disabled={pending}
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
        {s.unlock.body(user.name)}
      </Text>

      <Text style={[type.label, { color: c.text }]}>{cost}</Text>

      <Text style={[type.caption, { color: c.textMuted }]}>
        {s.unlock.note}
      </Text>

      {unlock.error ? (
        <Text accessibilityRole="alert" style={[type.body, { color: c.danger }]}>
          {errorMessage(unlock.error, s)}
        </Text>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
});
