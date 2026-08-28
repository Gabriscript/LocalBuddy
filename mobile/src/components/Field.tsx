import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { radius, space, type, useColors } from '@/theme';

/// Label above, error below, both always visible. A placeholder is not a label: it vanishes
/// the moment somebody starts typing, exactly when they need it.
export function Field({
  label,
  error,
  hint,
  secureTextEntry,
  ...rest
}: TextInputProps & { label: string; error?: string; hint?: string }) {
  const c = useColors();
  // A password field with no way to check what was typed is how people get locked out.
  const [revealed, setRevealed] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={[type.label, { color: c.text }]}>{label}</Text>

      <View style={styles.inputRow}>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={c.textMuted}
          autoCapitalize="none"
          secureTextEntry={secureTextEntry && !revealed}
          {...rest}
          style={[
            type.body,
            styles.input,
            { borderColor: error ? c.danger : c.border, color: c.text, backgroundColor: c.surfaceMuted },
            secureTextEntry ? styles.inputWithAction : null,
          ]}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setRevealed((r) => !r)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            hitSlop={12}
            style={styles.action}>
            <Ionicons name={revealed ? 'eye-off-outline' : 'eye-outline'} size={20} color={c.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {hint && !error ? <Text style={[type.caption, { color: c.textMuted }]}>{hint}</Text> : null}
      {error ? (
        // role="alert" so the error is announced, not just drawn.
        <Text accessibilityRole="alert" style={[type.caption, { color: c.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: space.xs + 2 },
  inputRow: { justifyContent: 'center' },
  // 52 keeps the tap target above 44pt and matches the button height.
  input: {
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
  },
  inputWithAction: { paddingRight: space.xxl },
  action: { position: 'absolute', right: space.md, height: 44, width: 44, alignItems: 'center', justifyContent: 'center' },
});
