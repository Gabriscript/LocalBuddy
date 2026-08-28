import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '@/api/client';
import { space, type, useColors } from '@/theme';

import { Button } from './Button';

/// Every screen has the same three non-happy states, and an error state always offers a way
/// out — a dead end with no retry is how a flaky network becomes a bug report.
export function Screen({
  loading,
  error,
  empty,
  onRetry,
  children,
}: {
  loading?: boolean;
  error?: unknown;
  empty?: string;
  onRetry?: () => void;
  children: ReactNode;
}) {
  const c = useColors();

  if (loading) {
    return (
      <Centered>
        <ActivityIndicator color={c.primary} />
      </Centered>
    );
  }

  if (error) {
    return (
      <Centered>
        <Ionicons name="cloud-offline-outline" size={40} color={c.textMuted} />
        <Text style={[type.body, styles.centeredText, { color: c.text }]}>{message(error)}</Text>
        {onRetry ? <Button title="Try again" variant="secondary" onPress={onRetry} /> : null}
      </Centered>
    );
  }

  if (empty) {
    return (
      <Centered>
        <Ionicons name="compass-outline" size={40} color={c.textMuted} />
        <Text style={[type.body, styles.centeredText, { color: c.textMuted }]}>{empty}</Text>
      </Centered>
    );
  }

  return <>{children}</>;
}

function Centered({ children }: { children: ReactNode }) {
  const c = useColors();
  return <View style={[styles.centered, { backgroundColor: c.background }]}>{children}</View>;
}

function message(error: unknown) {
  // ApiError carries the stable `code`; showing `detail` is fine, branching on it is not.
  return error instanceof ApiError ? error.message : 'Something went wrong.';
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg, gap: space.md },
  centeredText: { textAlign: 'center' },
});
