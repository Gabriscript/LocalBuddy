import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTripMutations, useTrips } from '@/api/hooks';
import { ActionError } from '@/components/ActionError';
import { Button } from '@/components/Button';
import { DateRange } from '@/components/DateRange';
import { DestinationSearch } from '@/components/DestinationSearch';
import { Screen } from '@/components/Screen';
import { useLanguage, useStrings } from '@/i18n';
import { isoDay, isoDayIn, shortDay } from '@/lib/dates';
import { useNotice } from '@/lib/notice';
import { radius, space, type, useColors } from '@/theme';

/// Where I will be, and when. Discovery shows these to people searching the same city, as
/// "In town now" or "Arriving". The city is picked from the suggestions; a typed one is only
/// for a place nobody lives in yet (DestinationSearch offers it as its own row).
///
/// The dates are tapped on a calendar (DateRange): arrival, then departure. The server's own
/// limits are the calendar's too, so a day it would refuse cannot be picked.
///
/// A trip is edited by tapping its row or its pencil. The server has no update, so saving an edit adds the new
/// trip first and removes the old one only once that worked: a refusal keeps the old trip.
const MAX_DAYS = 30;
const MAX_DAYS_AHEAD = 365;

export default function Trips() {
  const c = useColors();
  const router = useRouter();
  const s = useStrings();
  const { language } = useLanguage();
  const { items, isPending, error, refetch } = useTrips();
  const { create, remove } = useTripMutations();
  const notice = useNotice();
  // Discover sends the city it was searching, so "Add dates" opens with it already chosen.
  const params = useLocalSearchParams<{ city?: string }>();

  const [city, setCity] = useState(params.city);
  // Empty: a week chosen in advance read as dates somebody had already picked.
  const [range, setRange] = useState<{ from?: string; to?: string }>({});
  const [touched, setTouched] = useState(false);
  // The id of the trip loaded into the form, while it is being edited.
  const [editing, setEditing] = useState<string>();
  // The heading names the trip as it was, not the city being typed over it.
  const editingTrip = items.find((trip) => trip.id === editing);
  const { from, to } = range;
  const today = isoDay();

  function reset() {
    setCity(undefined);
    setRange({});
    setTouched(false);
    setEditing(undefined);
  }

  function edit(trip: { id: string; city: string; from: string; to: string }) {
    setCity(trip.city);
    setRange({ from: trip.from, to: trip.to });
    setTouched(false);
    setEditing(trip.id);
  }

  function save() {
    setTouched(true);
    if (!city || !from || !to) return;
    const old = editing;
    create.mutate(
      { city, from, to },
      {
        onSuccess: () => {
          if (old) remove.mutate(old);
          reset();
          notice({
            title: s.trips.saved,
            body: s.trips.savedBody(city, shortDay(from, language), shortDay(to, language)),
            action: {
              label: s.tripBar.seeWho,
              onPress: () => router.navigate({ pathname: '/discover', params: { city } }),
            },
          });
        },
      }
    );
  }

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: c.background }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/me'))}
          accessibilityRole="button"
          accessibilityLabel={s.common.goBack}
          hitSlop={8}
          style={styles.iconButton}>
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text role="heading" style={[type.title, { color: c.text }]}>
          {s.trips.title}
        </Text>
      </View>

      <Screen loading={isPending} error={error} onRetry={refetch}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={[type.body, { color: c.textMuted }]}>{s.trips.subtitle}</Text>

          {items.length ? (
            <View style={[styles.rows, { backgroundColor: c.surface, borderColor: c.border }]}>
              {items.map((trip, i) => (
                <View
                  key={trip.id}
                  style={[
                    styles.row,
                    // The trip in the form is marked by tone, never the accent.
                    { borderBottomColor: c.border, backgroundColor: trip.id === editing ? c.surfaceMuted : undefined },
                    i === items.length - 1 && styles.lastRow,
                  ]}>
                  {/* A past trip is history, not something to move. */}
                  <Pressable
                    onPress={() => edit(trip)}
                    disabled={trip.to < today}
                    accessibilityRole="button"
                    accessibilityLabel={s.trips.edit(trip.city)}
                    style={({ pressed }) => [styles.rowText, { opacity: pressed ? 0.6 : 1 }]}>
                    <Text style={[type.label, { color: c.text }]} numberOfLines={1}>
                      {trip.city}
                    </Text>
                    <Text style={[type.caption, { color: c.textMuted }]}>
                      {shortDay(trip.from, language)} – {shortDay(trip.to, language)}
                    </Text>
                  </Pressable>
                  {/* Tapping the row edits too, but nobody guessed it: the pencil says so. */}
                  {trip.to < today ? null : (
                    <Pressable
                      onPress={() => edit(trip)}
                      accessibilityRole="button"
                      accessibilityLabel={s.trips.edit(trip.city)}
                      style={styles.iconButton}>
                      <Ionicons name="pencil-outline" size={22} color={c.textMuted} aria-hidden />
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => {
                      // Removing the trip being edited leaves nothing to replace.
                      if (trip.id === editing) reset();
                      remove.mutate(trip.id);
                    }}
                    disabled={remove.isPending}
                    accessibilityRole="button"
                    accessibilityLabel={s.trips.remove(trip.city)}
                    hitSlop={12}
                    style={styles.iconButton}>
                    <Ionicons name="trash-outline" size={22} color={c.textMuted} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[type.body, { color: c.textMuted }]}>{s.trips.empty}</Text>
          )}

          <ActionError error={remove.error} />

          <Text role="heading" style={[type.label, { color: c.text }]}>
            {editingTrip ? s.trips.editHeading(editingTrip.city) : s.trips.add}
          </Text>

          {/* The box brings its own side margin; this cancels it so it lines up with the fields. */}
          <View style={styles.search}>
            <DestinationSearch city={city} onChange={setCity} />
          </View>
          {touched && !city ? (
            <Text accessibilityRole="alert" style={[type.caption, { color: c.danger }]}>
              {s.trips.pickCity}
            </Text>
          ) : null}

          <View style={styles.when}>
            <Text style={[type.label, { color: c.text }]}>{s.trips.when}</Text>
            {/* One line that is the instruction until both days are chosen, and the answer once
                they are. Red only when somebody tried to save without finishing. */}
            <Text
              accessibilityRole={touched && !to ? 'alert' : undefined}
              aria-live="polite"
              style={[type.body, { color: touched && !to ? c.danger : c.textMuted }]}>
              {from && to
                ? s.trips.range(shortDay(from, language), shortDay(to, language))
                : from
                  ? s.trips.pickEnd
                  : s.trips.tapDays}
            </Text>
            <DateRange
              // A trip loaded for editing opens the calendar on its own month.
              key={editing ?? 'new'}
              from={from}
              to={to}
              onChange={setRange}
              min={isoDayIn(0)}
              max={isoDayIn(MAX_DAYS_AHEAD)}
              maxDays={MAX_DAYS}
            />
          </View>

          <ActionError error={create.error} />
          <Button
            title={editing ? s.trips.saveChanges : s.trips.save}
            onPress={save}
            loading={create.isPending}
          />
          {editing ? <Button title={s.safety.cancel} variant="quiet" onPress={reset} /> : null}
        </ScrollView>
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingRight: space.md },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  body: { padding: space.md, gap: space.md },
  rows: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingLeft: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lastRow: { borderBottomWidth: 0 },
  rowText: { flex: 1, minHeight: 56, justifyContent: 'center' },
  search: { marginHorizontal: -space.md, marginTop: -space.md },
  when: { gap: space.sm },
});
