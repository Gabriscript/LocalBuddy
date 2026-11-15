import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DAYS } from '@/api/labels';
import { useLanguage, useStrings } from '@/i18n';
import { isoDay } from '@/lib/dates';
import { radius, space, type, useColors } from '@/theme';

/// A local calendar day from `YYYY-MM-DD`, so no time zone can shift it.
function dayOf(value: string) {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(value: string, days: number) {
  const date = dayOf(value);
  date.setDate(date.getDate() + days);
  return isoDay(date);
}

/// A month of days to tap, for "from the 12th to the 19th": the first tap is the arrival, the
/// second the departure, a third starts over. Built from plain views because Expo has no date
/// picker that behaves the same on Android and in the browser, and typing `2026-12-12` by hand
/// is not a way to say when a trip is.
///
/// Days travel as `YYYY-MM-DD` strings, which also compare correctly as text.
export function DateRange({
  from,
  to,
  onChange,
  min,
  max,
  maxDays,
}: {
  from?: string;
  to?: string;
  onChange: (range: { from?: string; to?: string }) => void;
  /// The first day that can be picked, and the last day a range may start on.
  min: string;
  max: string;
  /// The longest range allowed, both ends counted.
  maxDays: number;
}) {
  const c = useColors();
  const s = useStrings();
  const { language } = useLanguage();
  // The month on screen, as its first day. Opens on the range already chosen.
  const [month, setMonth] = useState(() => {
    const start = dayOf(from ?? min);
    return new Date(start.getFullYear(), start.getMonth(), 1);
  });

  const waitingForEnd = !!from && !to;
  const last = waitingForEnd ? addDays(from, maxDays - 1) : max;

  function pick(day: string) {
    // A day before the arrival is a new arrival, not a departure that runs backwards.
    if (waitingForEnd && day >= from) onChange({ from, to: day });
    else onChange({ from: day, to: undefined });
  }

  const year = month.getFullYear();
  const index = month.getMonth();
  // Monday first, as the week reads in every language the app speaks.
  const blanks = (month.getDay() + 6) % 7;
  const count = new Date(year, index + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array<null>(blanks).fill(null),
    ...Array.from({ length: count }, (_, day) => isoDay(new Date(year, index, day + 1))),
  ];
  // Whole weeks, so the last row keeps its seven columns.
  while (cells.length % 7) cells.push(null);

  const firstMonth = isoDay(month) <= min;
  const lastMonth = isoDay(new Date(year, index + 1, 1)) > last;
  const step = (months: number) => setMonth(new Date(year, index + months, 1));

  return (
    <View style={[styles.calendar, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={styles.head}>
        <Pressable
          onPress={() => step(-1)}
          disabled={firstMonth}
          accessibilityRole="button"
          accessibilityLabel={s.common.previousMonth}
          style={[styles.arrow, { opacity: firstMonth ? 0.3 : 1 }]}>
          <Ionicons name="chevron-back" size={22} color={c.text} aria-hidden />
        </Pressable>
        {/* Announced when it changes, since the arrows are what change it. */}
        <Text aria-live="polite" style={[type.label, styles.month, { color: c.text }]}>
          {month.toLocaleDateString(language, { month: 'long', year: 'numeric' })}
        </Text>
        <Pressable
          onPress={() => step(1)}
          disabled={lastMonth}
          accessibilityRole="button"
          accessibilityLabel={s.common.nextMonth}
          style={[styles.arrow, { opacity: lastMonth ? 0.3 : 1 }]}>
          <Ionicons name="chevron-forward" size={22} color={c.text} aria-hidden />
        </Pressable>
      </View>

      {/* Decorative: each day's own label already carries its weekday in full. */}
      <View style={styles.week} aria-hidden>
        {DAYS.map((day) => (
          <Text key={day} style={[type.caption, styles.weekday, { color: c.textMuted }]}>
            {s.days[day]}
          </Text>
        ))}
      </View>

      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} style={styles.week}>
          {cells.slice(row * 7, row * 7 + 7).map((day, column) => {
            if (!day) return <View key={column} style={styles.cell} />;
            const off = day < min || day > last;
            const end = day === from || day === to;
            const between = !!from && !!to && day > from && day < to;
            return (
              <Pressable
                key={day}
                onPress={() => pick(day)}
                disabled={off}
                accessibilityRole="button"
                aria-pressed={end || between}
                accessibilityLabel={dayOf(day).toLocaleDateString(language, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
                // The days in between are a band of Sunk Paper running through the row; the two
                // ends are filled like a selected chip. Selection is tone, never the accent.
                style={[styles.cell, between ? { backgroundColor: c.surfaceMuted } : null]}>
                <View style={[styles.day, end ? { backgroundColor: c.text } : null]}>
                  <Text
                    style={[
                      day === isoDay() ? type.label : type.body,
                      { color: end ? c.background : c.text, opacity: off ? 0.35 : 1 },
                    ]}>
                    {dayOf(day).getDate()}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  calendar: {
    padding: space.sm,
    gap: space.xs,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  head: { flexDirection: 'row', alignItems: 'center' },
  arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  month: { flex: 1, textAlign: 'center' },
  week: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center' },
  // 44 tall whatever the width, so a day is never a smaller target than a button.
  cell: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' },
  day: { width: 40, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
