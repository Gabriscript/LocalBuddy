import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useBlock, useReport } from '@/api/hooks';
import { useStrings } from '@/i18n';
import { radius, space, type, useColors } from '@/theme';

import { Button } from './Button';
import { Field } from './Field';
import { errorMessage } from './Screen';
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
  const s = useStrings();
  const [step, setStep] = useState<Step>('menu');
  const [reason, setReason] = useState('');
  const report = useReport();
  const { block } = useBlock();

  const titles: Record<Step, string> = {
    menu: user.name,
    report: s.safety.report(user.name),
    sent: s.safety.sent,
    block: s.safety.block(user.name),
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
              <Button title={s.common.close} onPress={onClose} />
            ) : (
              <Button
                title={s.safety.sendReport}
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
            {s.safety.sentBody}
          </Text>
        ) : (
          <>
            <Field
              label={s.safety.whatHappened}
              hint={s.safety.whatHappenedHint}
              value={reason}
              onChangeText={setReason}
              multiline
              maxLength={1000}
              autoCapitalize="sentences"
            />
            <Text style={[type.caption, { color: c.textMuted }]}>
              {s.safety.reportNotBlock}
            </Text>
          </>
        )}
        {error ? <Problem message={errorMessage(error, s)} /> : null}
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
              <Button title={s.safety.cancel} variant="quiet" onPress={() => setStep('menu')} />
            </View>
            <View style={styles.grow}>
              <Button
                title={s.safety.blockAction}
                variant="danger"
                loading={block.isPending}
                onPress={() => block.mutate(user.id, { onSuccess: onBlocked })}
              />
            </View>
          </>
        }>
        <Text style={[type.body, { color: c.text }]}>
          {s.safety.blockBody(user.name)}
        </Text>
        <Text style={[type.caption, { color: c.textMuted }]}>
          {s.safety.undoLater}
        </Text>
        {error ? <Problem message={errorMessage(error, s)} /> : null}
      </Sheet>
    );
  }

  return (
    <Sheet title={titles.menu} onClose={onClose}>
      {onReview ? <Action icon="star-outline" label={s.safety.leaveReview} onPress={onReview} /> : null}
      <Action icon="flag-outline" label={titles.report} onPress={() => setStep('report')} />
      <Action
        icon="remove-circle-outline"
        label={titles.block}
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
