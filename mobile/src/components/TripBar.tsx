import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTrips } from '@/api/hooks';
import { useLanguage, useStrings } from '@/i18n';
import { isoDay, shortDay } from '@/lib/dates';
import { radius, space, type, useColors } from '@/theme';

/// One line on the Discover band, under the destination search, that ties the feed to my own
/// trip: the way to add one, the trip I already have, or the dates for the city I searched.
/// Testers never found the trips under Me, and the feed ignored the trip they had.
///
/// It lives on the Night band, so its words are Paper and its one control is Night Raised, like
/// the filters button beside the search.
export function TripBar({ city, onSeeCity }: { city?: string; onSeeCity: (city: string) => void }) {
  const c = useColors();
  const router = useRouter();
  const s = useStrings();
  const { language } = useLanguage();
  const { items, isPending } = useTrips();
  // Nothing while loading: a bar that flips from "add a trip" to "your trip" reads as a glitch.
  if (isPending) return null;

  const today = isoDay();
  const upcoming = items.filter((trip) => trip.to >= today).sort((a, b) => a.from.localeCompare(b.from));
  const days = (trip: { from: string; to: string }) =>
    [shortDay(trip.from, language), shortDay(trip.to, language)] as const;

  if (city) {
    const here = upcoming.find((trip) => trip.city.toLowerCase() === city.toLowerCase());
    if (here) {
      return (
        <Pressable
          onPress={() => router.push('/trips')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.line, { opacity: pressed ? 0.75 : 1 }]}>
          <Ionicons name="airplane-outline" size={18} color={c.onNight} aria-hidden />
          <Text style={[type.label, styles.text, { color: c.onNight }]} numberOfLines={1}>
            {s.tripBar.yourDates(...days(here))}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={c.onNight} aria-hidden />
        </Pressable>
      );
    }
    return (
      <Line
        text={s.tripBar.goingTo(city)}
        action={s.tripBar.addDates}
        onPress={() => router.push({ pathname: '/trips', params: { city } })}
      />
    );
  }

  const next = upcoming[0];
  if (next) {
    return (
      <Line
        text={s.tripBar.yourTrip(next.city, ...days(next))}
        action={s.tripBar.seeWho}
        onPress={() => onSeeCity(next.city)}
      />
    );
  }
  return <Line text={s.tripBar.noTrip} action={s.tripBar.addTrip} onPress={() => router.push('/trips')} />;
}

function Line({ text, action, onPress }: { text: string; action: string; onPress: () => void }) {
  const c = useColors();
  return (
    <View style={styles.line}>
      <Text style={[type.caption, styles.text, { color: c.onNight }]} numberOfLines={2}>
        {text}
      </Text>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [styles.action, { backgroundColor: c.nightRaised, opacity: pressed ? 0.75 : 1 }]}>
        <Text style={[type.label, { color: c.onNight }]} numberOfLines={1}>
          {action}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  line: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 44 },
  text: { flex: 1 },
  action: {
    minHeight: 44,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
