import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useCities } from '@/api/hooks';
import { useStrings } from '@/i18n';
import { radius, space, type, useColors } from '@/theme';

/// "Where are you going?": the destination is the first thing a traveller knows, so it gets a box
/// of its own above the feed rather than a field inside the filters. Suggestions are the cities
/// where somebody actually lives, so picking one never lands on an empty feed.
export function DestinationSearch({ city, onChange }: { city?: string; onChange: (city?: string) => void }) {
  const c = useColors();
  const s = useStrings();
  const [text, setText] = useState(city ?? '');
  const [open, setOpen] = useState(false);
  const typed = text.trim();
  const { data: cities = [] } = useCities(typed);

  function pick(next?: string) {
    setText(next ?? '');
    setOpen(false);
    onChange(next || undefined);
  }

  return (
    <View style={styles.wrap}>
      <View style={[styles.box, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Ionicons name="search" size={20} color={c.textMuted} />
        <TextInput
          value={text}
          onChangeText={(next) => {
            setText(next);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onSubmitEditing={() => pick(typed)}
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

      {open ? (
        <View style={[styles.list, { backgroundColor: c.surface, borderColor: c.border }]}>
          {cities.map((name) => (
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
      <Text style={[type.body, { color: c.text }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: space.md, marginTop: space.md, gap: space.xs },
  box: {
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
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 44, paddingHorizontal: space.md },
});
