import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/generated';
import { useCreateReview } from '@/api/hooks';
import { useStrings } from '@/i18n';
import { useNotice } from '@/lib/notice';
import { space, type, useColors } from '@/theme';

import { Button } from './Button';
import { Chip } from './Chip';
import { Field } from './Field';
import { errorMessage } from './Screen';
import { Sheet } from './Sheet';

type Context = NonNullable<components['schemas']['ReferenceContext']>;

/// A reference (ADR-0017): a thumb, how the two met, and how it went. Only allowed once both
/// sides have written, and once per person: the server decides both, so this shows what it says
/// rather than guessing in advance.
export function ReviewSheet({
  user,
  onClose,
}: {
  user: { id: string; name: string };
  onClose: () => void;
}) {
  const c = useColors();
  const s = useStrings();
  const notice = useNotice();
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [context, setContext] = useState<Context | null>(null);
  const [comment, setComment] = useState('');
  const create = useCreateReview(user.id);
  const text = comment.trim();

  const contexts: { value: Context; label: string }[] = [
    { value: 'hosted', label: s.review.iHosted(user.name) },
    { value: 'wasHosted', label: s.review.theyHosted(user.name) },
    { value: 'metUp', label: s.review.metUp },
  ];

  function publish() {
    if (recommend === null || !context) return;
    create.mutate(
      { recommend, context, comment: text },
      {
        onSuccess: () => {
          onClose();
          notice({ title: s.review.published });
        },
      }
    );
  }

  return (
    <Sheet
      title={s.review.title(user.name)}
      onClose={onClose}
      footer={
        <View style={styles.grow}>
          <Button
            title={s.review.publish}
            loading={create.isPending}
            disabled={recommend === null || !context || !text}
            onPress={publish}
          />
        </View>
      }>
      <View style={styles.group}>
        <Text style={[type.label, { color: c.text }]}>{s.review.recommend(user.name)}</Text>
        <View style={styles.row} role="radiogroup" aria-label={s.review.recommend(user.name)}>
          <Chip
            as="radio"
            icon="thumbs-up-outline"
            label={s.review.yes}
            selected={recommend === true}
            onPress={() => setRecommend(true)}
          />
          <Chip
            as="radio"
            icon="thumbs-down-outline"
            label={s.review.no}
            selected={recommend === false}
            onPress={() => setRecommend(false)}
          />
        </View>
      </View>

      <View style={styles.group}>
        <Text style={[type.label, { color: c.text }]}>{s.review.howMet}</Text>
        <View style={styles.row} role="radiogroup" aria-label={s.review.howMet}>
          {contexts.map((option) => (
            <Chip
              key={option.value}
              as="radio"
              label={option.label}
              selected={context === option.value}
              onPress={() => setContext(option.value)}
            />
          ))}
        </View>
      </View>

      <Field
        label={s.review.howWent}
        hint={s.review.hint}
        value={comment}
        onChangeText={setComment}
        multiline
        maxLength={1000}
        autoCapitalize="sentences"
      />

      {create.error ? (
        <Text accessibilityRole="alert" style={[type.body, { color: c.danger }]}>
          {errorMessage(create.error, s)}
        </Text>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  group: { gap: space.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  grow: { flex: 1 },
});
