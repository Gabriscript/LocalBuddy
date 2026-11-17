import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/generated';
import { useTrips } from '@/api/hooks';
import { LIFE_ICON, roleName, STYLE_ICON } from '@/api/labels';
import { useLanguage, useStrings } from '@/i18n';
import { isoDay, overlaps, shortDay } from '@/lib/dates';
import { radius, space, type, useColors } from '@/theme';

import { AuthedImage } from './AuthedImage';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { Pill } from './Pill';

type Card = components['schemas']['ProfileCard'];

/// The photo leads and the text sits underneath it, rather than over a gradient: it keeps
/// body text at full contrast on every photo, including a bright one.
///
/// The card body and the two answers are siblings, never nested. A tappable card wrapping
/// tappable buttons is ambiguous about which one a tap meant — and on the web renderer it is
/// literally a <button> inside a <button>.
export const ProfileCard = memo(function ProfileCard({
  card,
  onOpen,
  onPass,
  onInterest,
  busy,
  answering,
}: {
  card: Card;
  /// These take the card rather than closing over it, so the feed can hand the same three
  /// functions to every row. Closures built per row make the `memo` above a no-op: the props
  /// never compare equal, and every card re-renders whenever the screen does.
  onOpen?: (card: Card) => void;
  onPass?: (card: Card) => void;
  onInterest?: (card: Card) => void;
  busy?: boolean;
  /// On the requests screen this person has already asked, so the same button is a yes back
  /// rather than a question.
  answering?: boolean;
}) {
  const c = useColors();
  const s = useStrings();
  const { language } = useLanguage();
  // Counts, not stars (ADR-0017). Nothing at 0, as the rating showed nothing when absent.
  const references = Number(card.references ?? 0) ? s.common.references(Number(card.references)) : null;
  const role = roleName(card.role, s);
  // Only present when the feed is filtered to a city this member is visiting. The whole stay
  // is shown, so a traveller can tell whether it still overlaps their own.
  const trip = card.trip
    ? card.trip.from <= isoDay()
      ? s.profileCard.inTownUntil(shortDay(card.trip.to, language))
      : s.profileCard.arriving(shortDay(card.trip.from, language), shortDay(card.trip.to, language))
    : null;
  // Read here rather than passed in, so the feed's props stay as they are; the query is cached.
  const { items: myTrips } = useTrips();
  const sameDays =
    !!card.trip &&
    myTrips.some((mine) => mine.city.toLowerCase() === card.trip!.city.toLowerCase() && overlaps(mine, card.trip!));

  // A card is one control, so a screen reader hears its label and nothing else. The label
  // therefore carries everything the card shows — the pills and the plan included, or pass and
  // interest become a blind choice made on half of what everyone else can see.
  const summary = [
    card.name,
    card.city,
    role,
    trip,
    sameDays ? s.profileCard.sameDays : null,
    card.freeToday ? s.common.freeToday : null,
    card.identityVerified ? s.profileCard.verified : null,
    references,
    card.hasCar ? s.profileCard.hasCar : null,
    card.hasPets ? s.profileCard.hasPets : null,
    card.smokes ? s.profileCard.smokes : null,
    card.whatWeWillDo,
  ]
    .filter((part): part is string => !!part)
    .join(', ');

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Pressable
        onPress={() => onOpen?.(card)}
        accessibilityRole="button"
        accessibilityLabel={summary}
        accessibilityHint={s.profileCard.openHint}
        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
        <View>
          <AuthedImage
            path={card.photoUrl}
            size="medium"
            style={[styles.photo, { backgroundColor: c.surfaceMuted }]}
            accessibilityLabel={s.common.photoOf(card.name ?? '')}
          />
          {/* What changes today's answer sits on the photograph, where the eye lands first:
              here now, arriving, free today. Opaque Card pills, so they read on any photo. */}
          {trip || card.freeToday ? (
            <View style={styles.today}>
              {trip ? <Pill icon="airplane-outline" label={trip} tone="strong" surface /> : null}
              {sameDays ? <Pill icon="calendar-outline" label={s.profileCard.sameDays} tone="strong" surface /> : null}
              {card.freeToday ? <Pill icon="cafe-outline" label={s.common.freeToday} tone="strong" surface /> : null}
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <View style={styles.headline}>
            <Text style={[type.title, styles.name, { color: c.text }]} numberOfLines={1}>
              {card.name}
            </Text>
            {card.identityVerified ? (
              <Pill icon="shield-checkmark-outline" label={s.common.verified} tone="positive" />
            ) : null}
          </View>

          <View style={styles.meta}>
            <Text style={[type.caption, { color: c.textMuted }]}>
              {card.city} · {role}
            </Text>
            {references ? (
              <>
                <Text style={[type.caption, { color: c.textMuted }]}>·</Text>
                <Ionicons name="thumbs-up-outline" size={12} color={c.textMuted} aria-hidden />
                <Text style={[type.caption, { color: c.textMuted }]}>{references}</Text>
              </>
            ) : null}
          </View>

          {/* The one line that matters comes before the facts about the person: what an
              afternoon with them would be is the reason to read on. */}
          {card.whatWeWillDo ? (
            <Text style={[type.body, { color: c.text }]} numberOfLines={3}>
              {card.whatWeWillDo}
            </Text>
          ) : null}

          {/* Left out when empty: an empty row would still take a gap's worth of height. */}
          {card.hasCar || card.hasPets || card.smokes || card.activityStyle || card.lifestyle ? (
            <View style={styles.pills}>
              {card.hasCar ? <Pill icon="car-outline" label={s.common.hasCar} /> : null}
              {card.hasPets ? <Pill icon="paw-outline" label={s.common.pets} /> : null}
              {card.smokes ? <Pill icon="flame-outline" label={s.common.smokes} /> : null}
              {card.activityStyle ? (
                <Pill icon={STYLE_ICON[card.activityStyle]} label={s.activityStyle[card.activityStyle]} />
              ) : null}
              {card.lifestyle ? <Pill icon={LIFE_ICON[card.lifestyle]} label={s.lifestyle[card.lifestyle]} /> : null}
            </View>
          ) : null}
        </View>
      </Pressable>

      {/* What the asker wrote, read before answering (ADR-0015). Their words, so their tone: Sunk
          Paper, like their side of a chat. Outside the card's button, so it is read on its own. */}
      {answering && card.note ? (
        <View style={[styles.note, { backgroundColor: c.surfaceMuted }]}>
          <Text style={[type.caption, { color: c.textMuted }]}>{s.requests.noteFrom(card.name ?? '')}</Text>
          <Text style={[type.body, { color: c.text }]} numberOfLines={5}>
            {card.note}
          </Text>
        </View>
      ) : null}

      {onPass && onInterest ? (
        <View style={styles.actions}>
          <IconButton
            name="close"
            label={s.profileCard.passOn(card.name ?? '')}
            onPress={() => onPass(card)}
            tint={c.textMuted}
            disabled={busy}
          />
          {/* Said in words. A bare tick asked the member to guess what it would send, and the
              question a card asks is whether to meet this person: a speech bubble, not a heart. */}
          <View style={styles.ask}>
            <Button
              variant="tinted"
              icon={answering ? 'checkmark' : 'chatbubble-ellipses-outline'}
              title={answering ? s.requests.accept : s.profile.ask}
              accessibilityLabel={
                answering ? s.profileCard.sayYesTo(card.name ?? '') : s.profileCard.askTo(card.name ?? '')
              }
              onPress={() => onInterest(card)}
              disabled={busy}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  // 4:3, declared as a ratio so the row keeps its height before the photo arrives. Taller
  // than this and the name, the plan and the two answers no longer share a screen with it.
  photo: { width: '100%', aspectRatio: 4 / 3 },
  today: {
    position: 'absolute',
    top: space.sm + 4,
    left: space.sm + 4,
    right: space.sm + 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  body: { padding: space.md, gap: space.sm },
  headline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  name: { flexShrink: 1 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.xs },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  note: { gap: space.xs, marginHorizontal: space.md, marginBottom: space.md, padding: space.md, borderRadius: radius.md },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingBottom: space.md,
  },
  ask: { flex: 1 },
});
