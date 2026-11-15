import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import { isoDayIn, shortDay } from '@/lib/dates';
import { radius, space, type, useColors } from '@/theme';

/// Where I will be, and when. Discovery shows these to people searching the same city, as
/// "In town now" or "Arriving". The city is picked from the suggestions; a typed one is only
/// for a place nobody lives in yet (DestinationSearch offers it as its own row).
///
/// The dates are tapped on a calendar (DateRange): arrival, then departure. The server's own
/// limits are the calendar's too, so a day it would refuse cannot be picked.
const MAX_DAYS = 30;
const MAX_DAYS_AHEAD = 365;

export default function Trips() {
  const c = useColors();
  const router = useRouter();
  const s = useStrings();
  const { language } = useLanguage();
  const { items, isPending, error, refetch } = useTrips();
  const { create, remove } = useTripMutations();

  const [city, setCity] = useState<string>();
  // A week from today to start with, so the calendar opens showing what a range looks like.
  const [range, setRange] = useState<{ from?: string; to?: string }>(() => ({ from: isoDayIn(0), to: isoDayIn(6) }));
  const [touched, setTouched] = useState(false);
  const { from, to } = range;

  function save() {
    setTouched(true);
    if (!city || !from || !to) return;
    create.mutate({ city, from, to });
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
                  style={[styles.row, { borderBottomColor: c.border }, i === items.length - 1 && styles.lastRow]}>
                  <View style={styles.rowText}>
                    <Text style={[type.label, { color: c.text }]} numberOfLines={1}>
                      {trip.city}
                    </Text>
                    <Text style={[type.caption, { color: c.textMuted }]}>
                      {shortDay(trip.from, language)} – {shortDay(trip.to, language)}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => remove.mutate(trip.id)}
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
            {s.trips.add}
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
                  : s.trips.pickStart}
            </Text>
            <DateRange
              from={from}
              to={to}
              onChange={setRange}
              min={isoDayIn(0)}
              max={isoDayIn(MAX_DAYS_AHEAD)}
              maxDays={MAX_DAYS}
            />
          </View>

          <ActionError error={create.error} />
          <Button title={s.trips.save} onPress={save} loading={create.isPending} />
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
  rowText: { flex: 1 },
  search: { marginHorizontal: -space.md, marginTop: -space.md },
  when: { gap: space.sm },
});
