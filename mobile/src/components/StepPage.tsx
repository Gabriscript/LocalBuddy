import { Ionicons } from '@expo/vector-icons';
import { Image, type ImageProps } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStrings } from '@/i18n';
import { radius, space, type, useColors } from '@/theme';

import { Button } from './Button';

/// Shared shell for the onboarding steps. The progress dots are not decoration: a five-step
/// flow with no sense of how much is left is a flow people abandon halfway.
///
/// Leaving `step` out drops the dots, for the one screen that is also reachable on its own:
/// "Step 2 of 5" is a lie to somebody who finished onboarding months ago and came back only to
/// verify themselves.
export function StepPage({
  step,
  total = 5,
  title,
  subtitle,
  cta,
  onNext,
  disabled,
  loading,
  image,
  children,
}: {
  /// Absent on a screen reached from inside the app rather than from the flow.
  step?: number;
  total?: number;
  title: string;
  subtitle?: string;
  cta: string;
  onNext: () => void;
  disabled?: boolean;
  loading?: boolean;
  /// A scene photograph as a band across the top. Left out, the page starts with the content.
  image?: ImageProps['source'];
  children?: ReactNode;
}) {
  const c = useColors();
  const s = useStrings();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    // With a band the photo runs under the status bar, so the top edge is not inset.
    <SafeAreaView
      edges={image ? ['bottom', 'left', 'right'] : undefined}
      style={[styles.page, { backgroundColor: c.background }]}>
      {/* The stack header would be an empty strip of Paper above the photo, so with a band it
          goes, and its back arrow comes back as a round Card button on the photo. The system
          back (Android, the browser) is the navigator's and does not need the header. */}
      {image ? <Stack.Screen options={{ headerShown: false }} /> : null}
      <ScrollView>
        {image ? (
          <View>
            <Image
              source={image}
              contentFit="cover"
              accessible={false}
              aria-hidden
              style={[styles.band, { height: height * 0.28 + insets.top, backgroundColor: c.surfaceMuted }]}
            />
            {router.canGoBack() ? (
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel={s.common.goBack}
                style={[styles.back, { top: insets.top + space.sm, backgroundColor: c.surface, borderColor: c.border }]}>
                <Ionicons name="chevron-back" size={24} color={c.text} aria-hidden />
              </Pressable>
            ) : null}
          </View>
        ) : null}
        <View style={styles.body}>
          {/* Not `step ?`: a step numbered 0 is a number, and a falsy check would hide the dots
              for it without a word of complaint. */}
          {step !== undefined ? (
            <View
              style={styles.dots}
              role="progressbar"
              aria-label={s.common.progress}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={step}
              // Read out as words: "Step 3 of 5" is clearer than the "60%" a bare value becomes.
              aria-valuetext={s.common.stepOf(step, total)}>
              {Array.from({ length: total }, (_, i) => (
                <View
                  key={i}
                  style={[styles.dot, { backgroundColor: i < step ? c.primary : c.border }]}
                />
              ))}
            </View>
          ) : null}

          <View style={styles.heading}>
            <Text role="heading" style={[type.display, { color: c.text }]}>
              {title}
            </Text>
            {subtitle ? <Text style={[type.body, { color: c.textMuted }]}>{subtitle}</Text> : null}
          </View>

          {children}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button title={cta} onPress={onNext} disabled={disabled} loading={loading} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  band: { width: '100%', borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg },
  back: {
    position: 'absolute',
    left: space.md,
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: space.lg, gap: space.lg },
  dots: { flexDirection: 'row', gap: space.xs + 2 },
  dot: { flex: 1, height: 4, borderRadius: radius.pill },
  heading: { gap: space.sm },
  footer: { padding: space.lg, paddingTop: space.sm },
});
