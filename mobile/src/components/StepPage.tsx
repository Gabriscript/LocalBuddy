import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radius, space, type, useColors } from '@/theme';

import { Button } from './Button';

/// Shared shell for the onboarding steps. The progress dots are not decoration: a five-step
/// flow with no sense of how much is left is a flow people abandon halfway.
export function StepPage({
  step,
  total = 5,
  title,
  subtitle,
  cta,
  onNext,
  disabled,
  children,
}: {
  step: number;
  total?: number;
  title: string;
  subtitle?: string;
  cta: string;
  onNext: () => void;
  disabled?: boolean;
  children?: ReactNode;
}) {
  const c = useColors();

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.body}>
        <View
          style={styles.dots}
          accessibilityRole="progressbar"
          accessibilityLabel={`Step ${step} of ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <View
              key={i}
              style={[styles.dot, { backgroundColor: i < step ? c.primary : c.border }]}
            />
          ))}
        </View>

        <View style={styles.heading}>
          <Text style={[type.display, { color: c.text }]}>{title}</Text>
          {subtitle ? <Text style={[type.body, { color: c.textMuted }]}>{subtitle}</Text> : null}
        </View>

        {children}
      </ScrollView>

      <View style={styles.footer}>
        <Button title={cta} onPress={onNext} disabled={disabled} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  body: { padding: space.lg, gap: space.lg },
  dots: { flexDirection: 'row', gap: space.xs + 2 },
  dot: { flex: 1, height: 4, borderRadius: radius.pill },
  heading: { gap: space.sm },
  footer: { padding: space.lg, paddingTop: space.sm },
});
