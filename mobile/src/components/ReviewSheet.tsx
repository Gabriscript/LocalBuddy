import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useCreateReview } from '@/api/hooks';
import { useStrings } from '@/i18n';
import { space, type, useColors } from '@/theme';

import { Button } from './Button';
import { Field } from './Field';
import { errorMessage } from './Screen';
import { Sheet } from './Sheet';

/// A review needs both sides to have written, and only one per person is allowed. The server
/// decides both, so this shows what it says rather than guessing in advance.
export function ReviewSheet({
  user,
  onClose,
}: {
  user: { id: string; name: string };
  onClose: () => void;
}) {
  const c = useColors();
  const s = useStrings();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const create = useCreateReview(user.id);

  if (create.isSuccess) {
    return (
      <Sheet
        title={s.review.sent}
        onClose={onClose}
        footer={
          <View style={styles.grow}>
            <Button title={s.common.close} onPress={onClose} />
          </View>
        }>
        <Text style={[type.body, { color: c.text }]}>
          {s.review.sentBody}
        </Text>
      </Sheet>
    );
  }

  return (
    <Sheet
      title={s.review.title(user.name)}
      onClose={onClose}
      footer={
        <View style={styles.grow}>
          <Button
            title={s.review.send}
            loading={create.isPending}
            disabled={!rating}
            onPress={() => create.mutate({ rating, comment: comment.trim() })}
          />
        </View>
      }>
      <View style={styles.group}>
        <Text style={[type.label, { color: c.text }]}>{s.review.howWasIt}</Text>
        <View style={styles.stars} role="radiogroup" aria-label={s.review.rating}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable
              key={star}
              onPress={() => setRating(star)}
              role="radio"
              aria-checked={rating === star}
              aria-label={s.review.stars(star)}
              style={styles.star}>
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={30}
                color={c.text}
                aria-hidden
              />
            </Pressable>
          ))}
        </View>
      </View>

      <Field
        label={s.review.comment}
        hint={s.review.commentHint}
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
  stars: { flexDirection: 'row', gap: space.xs },
  star: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  grow: { flex: 1 },
});
