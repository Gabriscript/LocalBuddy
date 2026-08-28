import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/generated';
import { radius, space, type, useColors } from '@/theme';

import { AuthedImage } from './AuthedImage';
import { IconButton } from './IconButton';
import { Pill } from './Pill';

type Card = components['schemas']['ProfileCard'];

/// The photo leads and the text sits underneath it, rather than over a gradient: it keeps
/// body text at full contrast on every photo, including a bright one.
///
/// The card body and the two decision buttons are siblings, never nested. A tappable card
/// wrapping tappable buttons is ambiguous about which one a tap meant — and on the web
/// renderer it is literally a <button> inside a <button>.
export const ProfileCard = memo(function ProfileCard({
  card,
  onOpen,
  onPass,
  onInterest,
  busy,
}: {
  card: Card;
  onOpen?: () => void;
  onPass?: () => void;
  onInterest?: () => void;
  busy?: boolean;
}) {
  const c = useColors();

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`Open ${card.name}'s profile`}
        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
        <AuthedImage
          path={card.photoUrl}
          style={[styles.photo, { backgroundColor: c.surfaceMuted }]}
          accessibilityLabel={`Photo of ${card.name}`}
        />

        <View style={styles.body}>
          <View style={styles.headline}>
            <Text style={[type.title, styles.name, { color: c.text }]} numberOfLines={1}>
              {card.name}
            </Text>
            {typeof card.rating === 'number' ? (
              <View style={styles.rating}>
                <Ionicons name="star" size={14} color={c.text} />
                {/* Tabular figures: a rating going from 4.9 to 5.0 must not nudge the row. */}
                <Text style={[type.label, styles.figure, { color: c.text }]}>
                  {card.rating.toFixed(1)}
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={[type.caption, { color: c.textMuted }]}>
            {card.city} · {card.role}
          </Text>

          <View style={styles.pills}>
            {card.identityVerified ? (
              <Pill icon="shield-checkmark-outline" label="Verified" tone="positive" />
            ) : null}
            {card.hasCar ? <Pill icon="car-outline" label="Has a car" /> : null}
            {card.hasPets ? <Pill icon="paw-outline" label="Pets" /> : null}
            {card.smokes ? <Pill icon="flame-outline" label="Smokes" /> : null}
          </View>

          {card.whatWeWillDo ? (
            <Text style={[type.body, { color: c.text }]} numberOfLines={2}>
              {card.whatWeWillDo}
            </Text>
          ) : null}
        </View>
      </Pressable>

      {onPass && onInterest ? (
        <View style={styles.actions}>
          <IconButton
            name="close"
            label={`Pass on ${card.name}`}
            onPress={onPass}
            tint={c.textMuted}
            disabled={busy}
          />
          <IconButton
            name="heart"
            label={`Show interest in ${card.name}`}
            onPress={onInterest}
            tint={c.primary}
            disabled={busy}
          />
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  // 4:3, declared as a ratio so the row keeps its height before the photo arrives. Taller
  // than this and the name, the pills and the two decision buttons fall below the fold on a
  // phone — which turns a one-tap decision into a scroll.
  photo: { width: '100%', aspectRatio: 4 / 3 },
  body: { padding: space.md, gap: space.sm },
  headline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  name: { flexShrink: 1 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  figure: { fontVariant: ['tabular-nums'] },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingBottom: space.md,
  },
});
