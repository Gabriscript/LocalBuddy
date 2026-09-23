import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, space, type, useColors } from '@/theme';

/// The panel that slides up from the bottom edge: filters, safety actions, a review. Rendered
/// only while it is open, so whatever it holds starts from the current state every time. The
/// cost is no slide-out animation on close, which nobody waits for.
export function Sheet({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      {/* Tapping beside the sheet closes it, the way a sheet does. Hidden from screen
          readers, which have the Close button instead. */}
      <Pressable
        aria-hidden
        style={[styles.backdrop, { backgroundColor: c.scrim }]}
        onPress={onClose}
      />

      <View
        role="dialog"
        aria-modal
        aria-label={title}
        style={[styles.sheet, { backgroundColor: c.background }]}>
        <View style={styles.header}>
          <Text role="heading" style={[type.title, { color: c.text }]}>
            {title}
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            // Just "Close": the dialog already carries its own name, and some titles are a
            // person, which made this read as "Close alice".
            accessibilityLabel="Close"
            hitSlop={8}
            style={styles.close}>
            <Ionicons name="close" size={24} color={c.text} aria-hidden />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>

        {footer ? (
          <View
            style={[
              styles.footer,
              { borderTopColor: c.border, paddingBottom: insets.bottom + space.md },
            ]}>
            {footer}
          </View>
        ) : (
          <View style={{ height: insets.bottom }} />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Colour comes from the theme: the one hand-written veil in the app was also the thinnest.
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '85%',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: space.md,
    paddingRight: space.xs,
    paddingTop: space.md,
  },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  body: { padding: space.md, gap: space.lg },
  footer: {
    flexDirection: 'row',
    gap: space.sm,
    padding: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
