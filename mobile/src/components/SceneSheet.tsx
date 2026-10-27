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
/// `focus` is for a scene whose subject sits low in the frame, where the sheet would cover it: the
/// photograph is held to the top half of the screen and shifted so `y` (0 top, 1 bottom of the
/// photo) lands in the visible strip. `ratio` is the photo's width over its height.
export function SceneSheet({
  image,
  focus,
  children,
}: {
  image: ImageProps['source'];
  focus?: { y: number; ratio: number };
  children: ReactNode;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();

  let photo: ImageProps['style'] = StyleSheet.absoluteFill;
  let position: ImageProps['contentPosition'];
  if (focus) {
    const strip = height * 0.5;
    const shown = Math.max(strip, width / focus.ratio); // the photo's height once scaled to cover
    // Put the focus at 56% of the strip, which is above the sheet on every phone and on a wide window.
    const top = shown > strip ? (focus.y * shown - strip * 0.56) / (shown - strip) : 0.5;
    photo = { position: 'absolute', top: 0, left: 0, right: 0, height: strip };
    position = { top: `${Math.min(Math.max(top, 0), 1) * 100}%` };
  }

  return (
    <View style={[styles.page, { backgroundColor: c.background }]}>
      {/* Decorative: the scene sets a mood and says nothing a screen reader needs. */}
      <Image source={image} contentFit="cover" contentPosition={position} style={photo} accessible={false} aria-hidden />
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
