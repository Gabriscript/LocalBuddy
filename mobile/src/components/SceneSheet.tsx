import { Image, type ImageProps } from 'expo-image';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { space, useColors } from '@/theme';

/// The signed-out screens: a scene photograph behind everything, and a sheet of Paper over its
/// lower part holding the form. The sheet scrolls, so the keyboard can never cover a field.
export function SceneSheet({ image, children }: { image: ImageProps['source']; children: ReactNode }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  return (
    <View style={[styles.page, { backgroundColor: c.background }]}>
      {/* Decorative: the scene sets a mood and says nothing a screen reader needs. */}
      <Image source={image} contentFit="cover" style={StyleSheet.absoluteFill} accessible={false} aria-hidden />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.page}>
        <ScrollView
          // At least the top 30% stays photograph, however long the form below it gets.
          contentContainerStyle={[styles.scroll, { paddingTop: height * 0.3 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={[styles.sheet, { backgroundColor: c.background, paddingBottom: insets.bottom + space.lg }]}>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'flex-end' },
  // 28, above the 20 of a card: the sheet is the one surface that holds a whole screen.
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: space.lg, gap: space.md },
});
