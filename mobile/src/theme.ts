import { useColorScheme } from 'react-native';

/// Semantic tokens, never raw hex in a screen. Rose is the discovery/primary action;
/// surfaces stay warm neutral rather than tinted, so photos carry the colour and body text
/// keeps its contrast ratio. Every pair below is >= 4.5:1 against the surface it sits on.
const light = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F7F5F3',
  text: '#1C1A19',
  textMuted: '#6B6560',
  border: '#E6E1DC',
  primary: '#E11D48',
  onPrimary: '#FFFFFF',
  accent: '#2563EB',
  success: '#0A7D22',
  danger: '#DC2626',
  scrim: 'rgba(0,0,0,0.5)',
  overlay: 'rgba(0,0,0,0.45)',
  onOverlay: '#FFFFFF',
};

/// Dark is a re-tone, not an inversion: the rose lightens so it stays legible on a dark
/// surface instead of vibrating against it.
const dark: typeof light = {
  background: '#141212',
  surface: '#1E1B1B',
  surfaceMuted: '#262222',
  text: '#F5F2F0',
  textMuted: '#A9A19B',
  border: '#332E2E',
  primary: '#FB7185',
  onPrimary: '#3F0716',
  accent: '#93B4FF',
  success: '#5CD37B',
  danger: '#F87171',
  scrim: 'rgba(0,0,0,0.6)',
  overlay: 'rgba(0,0,0,0.45)',
  onOverlay: '#FFFFFF',
};

/// 4pt rhythm. Section spacing uses the named tiers, never an arbitrary number.
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 8, md: 12, lg: 20, pill: 999 } as const;
export const type = {
  display: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 32, lineHeight: 40 },
  title: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 22, lineHeight: 30 },
  body: { fontSize: 16, lineHeight: 24 },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const },
  caption: { fontSize: 13, lineHeight: 18 },
};

/// Every interactive surface animates in this window; one rhythm for the whole app.
export const motion = { press: 120, transition: 220 } as const;

export type Colors = typeof light;

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
}
