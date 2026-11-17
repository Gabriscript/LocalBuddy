import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';

import { useCities, useTrips } from '@/api/hooks';
import { useStrings } from '@/i18n';
import { radius, space, type, useColors } from '@/theme';

/// "Where are you going?": the destination is the first thing a traveller knows, so it gets a box
/// of its own above the feed rather than a field inside the filters. Suggestions are the cities
/// where somebody actually lives, so picking one never lands on an empty feed.
export function DestinationSearch({
  city,
  onChange,
  trailing,
  style,
}: {
  city?: string;
  onChange: (city?: string) => void;
  /// A control on the same line as the box, to its right: the filters, on Discover.
  trailing?: ReactNode;
  /// Replaces the box's own page margins where its parent already has them.
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const s = useStrings();
  const [text, setText] = useState(city ?? '');
  const [open, setOpen] = useState(false);
  const focused = useRef(false);
  // The city can change from outside (deep link, back navigation): follow it unless typing.
  useEffect(() => {
    if (!focused.current) setText(city ?? '');
  }, [city]);
  const typed = text.trim();
  const { data: cities = [], isPlaceholderData: stale } = useCities(typed);
  // My own upcoming trips are the likeliest next search, so they lead the empty box.
  const { items: trips } = useTrips();
  const tripCities = typed ? [] : [...new Set(trips.map((trip) => trip.city))];

  // Enter does what tapping the first suggestion would: testers typed "Helsinki", pressed Enter
  // and saw nothing happen. An exact match wins, then the server's first suggestion, which may
  // name the city in its other language ("florence" suggests "Firenze"). A list still showing the
  // last keystroke's answer is not trusted for that: the typed text itself is searched instead.
  function submit() {
    const lower = typed.toLowerCase();
    if (!lower) return pick(undefined);
    pick(cities.find((name) => name.toLowerCase() === lower) ?? (stale ? undefined : cities[0]) ?? typed);
  }

  function pick(next?: string) {
    setText(next ?? '');
    setOpen(false);
    onChange(next || undefined);
  }

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.line}>
      <View style={[styles.box, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Ionicons name="search" size={20} color={c.textMuted} />
        <TextInput
          value={text}
          onChangeText={(next) => {
            setText(next);
            setOpen(true);
            // An empty box must not hide an active city filter.
            if (!next.trim() && city) onChange(undefined);
          }}
          onFocus={() => {
            focused.current = true;
            setOpen(true);
          }}
          // Delayed so a tap on a row still lands before the list goes away.
          onBlur={() => {
            focused.current = false;
            setTimeout(() => setOpen(false), 200);
          }}
          onSubmitEditing={submit}
          placeholder={s.discover.search}
          placeholderTextColor={c.textMuted}
          accessibilityLabel={s.discover.search}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="search"
          style={[type.body, styles.input, { color: c.text }]}
        />
        {text ? (
          <Pressable
            onPress={() => pick(undefined)}
            accessibilityRole="button"
            accessibilityLabel={s.discover.clearSearch}
            hitSlop={12}>
            <Ionicons name="close-circle" size={20} color={c.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {trailing}
      </View>

      {open ? (
        <View style={[styles.list, { backgroundColor: c.surface, borderColor: c.border }]}>
          {tripCities.map((name) => (
            <Row key={`trip-${name}`} icon="airplane-outline" label={name} onPress={() => pick(name)} />
          ))}
          {cities.filter((name) => !tripCities.includes(name)).map((name) => (
            <Row key={name} icon="location-outline" label={name} onPress={() => pick(name)} />
          ))}
          {/* A city nobody lives in yet is still a fair search: the feed says so if it is empty. */}
          {typed && !cities.some((name) => name.toLowerCase() === typed.toLowerCase()) ? (
            <Row icon="search" label={s.discover.searchTyped(typed)} onPress={() => pick(typed)} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function Row({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}>
      <Ionicons name={icon} size={18} color={c.textMuted} />
      <Text style={[type.body, styles.label, { color: c.text }]} numberOfLines={1}>
        {label}
      </Text>
      {/* Says the row is a choice to tap, not a line of text. */}
      <Ionicons name="chevron-forward" size={18} color={c.textMuted} aria-hidden />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: space.md, marginTop: space.md, gap: space.xs },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  box: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 52,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, minHeight: 52 },
  list: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, paddingVertical: space.xs },
  label: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 44, paddingHorizontal: space.md },
});
