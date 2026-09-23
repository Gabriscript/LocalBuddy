import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useBlock, useReport } from '@/api/hooks';
import { radius, space, type, useColors } from '@/theme';

import { Button } from './Button';
import { Field } from './Field';
import { Sheet } from './Sheet';

type Step = 'menu' | 'report' | 'sent' | 'block';

/// Report and block, in the one place both belong. Deliberately a plain list rather than
/// anything clever: this is what somebody opens when something has gone wrong, and it should
/// look like every other app's version of itself.
export function SafetySheet({
  user,
  onClose,
  onBlocked,
  onReview,
}: {
  user: { id: string; name: string };
  onClose: () => void;
  /// Called once the block has landed. The caller leaves the screen: the member is gone from it.
  onBlocked: () => void;
  /// Passed only where a review is possible, which is a conversation.
  onReview?: () => void;
}) {
  const c = useColors();
  const [step, setStep] = useState<Step>('menu');
  const [reason, setReason] = useState('');
  const report = useReport();
  const { block } = useBlock();

  const titles: Record<Step, string> = {
    menu: user.name,
    report: `Report ${user.name}`,
    sent: 'Report sent',
    block: `Block ${user.name}`,
  };

  const error = report.error ?? block.error;

  if (step === 'report' || step === 'sent') {
    const sent = step === 'sent';
    return (
      <Sheet
        title={titles[step]}
        onClose={onClose}
        footer={
          <View style={styles.grow}>
            {sent ? (
              <Button title="Close" onPress={onClose} />
            ) : (
              <Button
                title="Send report"
                loading={report.isPending}
                disabled={!reason.trim()}
                onPress={() =>
                  report.mutate(
                    { reportedId: user.id, reason: reason.trim() },
                    { onSuccess: () => setStep('sent') }
                  )
                }
              />
            )}
          </View>
        }>
        {sent ? (
          <Text style={[type.body, { color: c.text }]}>
            Thank you. A moderator reads every report. You will not hear back about this one, and
            nobody is told who sent it.
          </Text>
        ) : (
          <>
            <Field
              label="What happened?"
              hint="Write it as you would tell a person. A moderator reads this, not a machine."
              value={reason}
              onChangeText={setReason}
              multiline
              maxLength={1000}
              autoCapitalize="sentences"
            />
            <Text style={[type.caption, { color: c.textMuted }]}>
              Reporting does not block anyone. If you also want them gone from your feed and your
              inbox, block them.
            </Text>
          </>
        )}
        {error ? <Problem message={error.message} /> : null}
      </Sheet>
    );
  }

  if (step === 'block') {
    return (
      <Sheet
        title={titles.block}
        onClose={onClose}
        footer={
          <>
            <View style={styles.grow}>
              <Button title="Cancel" variant="quiet" onPress={() => setStep('menu')} />
            </View>
            <View style={styles.grow}>
              <Button
                title="Block"
                variant="danger"
                loading={block.isPending}
                onPress={() => block.mutate(user.id, { onSuccess: onBlocked })}
              />
            </View>
          </>
        }>
        <Text style={[type.body, { color: c.text }]}>
          {user.name} will not see your profile and you will not see theirs. Any conversation
          between you closes in both directions.
        </Text>
        <Text style={[type.caption, { color: c.textMuted }]}>
          You can undo this later from Blocked members, in your own profile.
        </Text>
        {error ? <Problem message={error.message} /> : null}
      </Sheet>
    );
  }

  return (
    <Sheet title={titles.menu} onClose={onClose}>
      {onReview ? <Action icon="star-outline" label="Leave a review" onPress={onReview} /> : null}
      <Action icon="flag-outline" label={`Report ${user.name}`} onPress={() => setStep('report')} />
      <Action
        icon="remove-circle-outline"
        label={`Block ${user.name}`}
        tone="danger"
        onPress={() => setStep('block')}
      />
    </Sheet>
  );
}

function Action({
  icon,
  label,
  onPress,
  tone = 'default',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
}) {
  const c = useColors();
  const tint = tone === 'danger' ? c.danger : c.text;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: c.surfaceMuted, opacity: pressed ? 0.75 : 1 },
      ]}>
      <Ionicons name={icon} size={22} color={tint} aria-hidden />
      <Text style={[type.label, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

function Problem({ message }: { message: string }) {
  const c = useColors();
  return (
    <Text accessibilityRole="alert" style={[type.body, { color: c.danger }]}>
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 56,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
  },
  grow: { flex: 1 },
});
