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
  emptyIcon = 'compass-outline',
  emptyAction,
  onRetry,
  skeleton,
  children,
}: {
  loading?: boolean;
  error?: unknown;
  empty?: string;
  /// What nothing looks like on this screen: a compass suits the feed and nothing else.
  emptyIcon?: keyof typeof Ionicons.glyphMap;
  /// The way out of the empty state. Advice with no control to act on it is just advice.
  emptyAction?: ReactNode;
  onRetry?: () => void;
  /// The shape of what is loading, for screens whose content has a known one. A list gets
  /// its rows back rather than a spinner in the middle of nothing.
  skeleton?: ReactNode;
  children: ReactNode;
}) {
  const c = useColors();

  if (loading) {
    return (
      skeleton ?? (
        <Centered>
          <ActivityIndicator color={c.primary} />
        </Centered>
      )
    );
  }

  if (error) {
    return (
      <Centered>
        <Ionicons name="cloud-offline-outline" size={40} color={c.textMuted} aria-hidden />
        <Text style={[type.body, styles.centeredText, { color: c.text }]}>{errorMessage(error)}</Text>
        {onRetry ? <Button title="Try again" variant="secondary" onPress={onRetry} /> : null}
      </Centered>
    );
  }

  if (empty) {
    return (
      <Centered>
        <Ionicons name={emptyIcon} size={40} color={c.textMuted} aria-hidden />
        <Text style={[type.body, styles.centeredText, { color: c.textMuted }]}>{empty}</Text>
        {emptyAction}
      </Centered>
    );
  }

  return <>{children}</>;
}

function Centered({ children }: { children: ReactNode }) {
  const c = useColors();
  return <View style={[styles.centered, { backgroundColor: c.background }]}>{children}</View>;
}

/// The end of a paged list, while the page after it is on its way. Handed to a FlatList as
/// `ListFooterComponent`; on the inverted message list that puts it at the visual top, which
/// is exactly where the older messages are coming from.
export function LoadingMore({ visible }: { visible?: boolean }) {
  const c = useColors();
  if (!visible) return null;
  return (
    <View style={styles.more}>
      <ActivityIndicator color={c.textMuted} />
    </View>
  );
}

/// What a member is told when something failed. Exported because the full-screen state and the
/// note beside a single failed action have to say the same thing about the same error.
export function errorMessage(error: unknown) {
  // ApiError carries the stable `code`; showing `detail` is fine, branching on it is not.
  return error instanceof ApiError ? error.message : 'Something went wrong.';
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg, gap: space.md },
  centeredText: { textAlign: 'center' },
  more: { paddingVertical: space.lg, alignItems: 'center' },
});
