import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/generated';
import { useTrips } from '@/api/hooks';
import { useLanguage, useStrings } from '@/i18n';
import { isoDay, shortDay } from '@/lib/dates';
import { space, type, useColors } from '@/theme';

import { ActionError } from './ActionError';
import { Button } from './Button';
import { Field } from './Field';
import { Sheet } from './Sheet';

type Trip = components['schemas']['PublicTrip'];

/// The server's cap on a note (ADR-0015), so nothing typed here can be refused for its length.
const NOTE_MAX = 500;

/// "Ask to meet", with a note the person asked reads before answering (ADR-0015). The screen
/// that opens it sends the request, so the feed and the profile keep their own way of saying it
/// went; this only collects the words and shows a refusal beside them.
export function AskSheet({
  user,
  pending,
  error,
  onSend,
  onClose,
}: {
  /// `trip` is their visit, when the feed knows it.
  user: { name: string; city: string; trip?: Trip | null };
  pending: boolean;
  error: unknown;
  onSend: (note: string) => void;
  onClose: () => void;
}) {
  const c = useColors();
  const s = useStrings();
  const { language } = useLanguage();
  const { items } = useTrips();

  // Prefilled whenever the app can write the first sentence: my trip to their city, or my trip
  // to the city they are visiting on overlapping days. My dates either way.
  const today = isoDay();
  const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
  const mine = items.filter((trip) => trip.to >= today).sort((a, b) => a.from.localeCompare(b.from));
  const visiting = mine.find((trip) => same(trip.city, user.city));
  const theirs = user.trip;
  const alongside = theirs
    ? mine.find((trip) => same(trip.city, theirs.city) && trip.from <= theirs.to && theirs.from <= trip.to)
    : undefined;
  const trip = visiting ?? alongside;
  const suggestion = trip
    ? (visiting ? s.askSheet.suggestVisiting : s.askSheet.suggestSame)(
        user.name,
        trip.city,
        shortDay(trip.from, language),
        shortDay(trip.to, language)
      )
    : '';

  // null until the member types: the suggestion follows the trips if they arrive after opening.
  const [typed, setTyped] = useState<string | null>(null);
  const note = typed ?? suggestion;
  // The caret goes to the end of the suggestion on the first focus, then belongs to the member.
  const [caret, setCaret] = useState<{ start: number; end: number }>();
  const left = NOTE_MAX - note.length;

  // Not while sending: a refusal is shown in here, and nowhere once the sheet is gone.
  const close = () => {
    if (!pending) onClose();
  };

  return (
    <Sheet
      title={s.askSheet.title(user.name)}
      onClose={close}
      footer={
        <>
          <View style={styles.grow}>
            <Button title={s.safety.cancel} variant="quiet" disabled={pending} onPress={close} />
          </View>
          <View style={styles.grow}>
            <Button title={s.askSheet.send} loading={pending} onPress={() => onSend(note)} />
          </View>
        </>
      }>
      <View style={styles.group}>
        <Field
          label={s.askSheet.noteLabel(user.name)}
          placeholder={s.askSheet.placeholder}
          value={note}
          onChangeText={(text) => {
            setCaret(undefined);
            setTyped(text);
          }}
          onFocus={() => {
            if (typed === null && note) setCaret({ start: note.length, end: note.length });
          }}
          selection={caret}
          onSelectionChange={(event) => {
            const { start, end } = event.nativeEvent.selection;
            if (caret && (start !== caret.start || end !== caret.end)) setCaret(undefined);
          }}
          multiline
          maxLength={NOTE_MAX}
          autoCapitalize="sentences"
          editable={!pending}
        />
        {left <= 100 ? (
          <Text style={[type.caption, { color: c.textMuted }]}>{s.askSheet.charsLeft(left)}</Text>
        ) : null}
        <Text style={[type.caption, { color: c.textMuted }]}>{s.askSheet.helper(user.name)}</Text>
      </View>

      <ActionError error={error} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  // Field's own spacing, so the counter and the helper read as part of the field.
  group: { gap: space.xs + 2 },
  grow: { flex: 1 },
});
