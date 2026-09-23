import { useColorScheme } from 'react-native';

/// Semantic tokens, never raw hex in a screen. Ink carries the primary action and stays
/// quiet, so the photos are the only colour on the page, and an app where a stranger walks
/// you around their neighbourhood does not greet people in the palette of a dating app.
/// The neutrals are warm paper rather than white, so a card reads as something laid on the
/// page instead of a rectangle drawn by its border.
/// Every pair below is >= 4.5:1 against the surface it sits on, `surfaceMuted` included —
/// which is the one that catches people out, because it is where the small print lives.
const light = {
  background: '#F7F4F1',
  surface: '#FEFDFC',
  surfaceMuted: '#EFEAE5',
  text: '#1C1A19',
  textMuted: '#6B6560',
  border: '#E6E1DC',
  primary: '#1E3A5C',
  onPrimary: '#FFFFFF',
  // Dark enough for the muted surface it always sits on: the old #0A7D22 was 4.43:1 there,
  // under AA, because every use of it is a Pill and a Pill is always on surfaceMuted.
  success: '#0B6E20',
  danger: '#DC2626',
  scrim: 'rgba(0,0,0,0.5)',
  // For the one screen that takes the whole display: a veil thin enough to remember where you
  // were, thick enough that the photograph behind it stops competing.
  scrimStrong: 'rgba(0,0,0,0.82)',
  overlay: 'rgba(0,0,0,0.45)',
  onOverlay: '#FFFFFF',
};

/// Dark is a re-tone, not an inversion: the ink lifts to a pale steel so it stays legible on
/// a dark surface instead of sinking into it.
const dark: typeof light = {
  background: '#141212',
  surface: '#1E1B1B',
  surfaceMuted: '#262222',
  text: '#F5F2F0',
  textMuted: '#A9A19B',
  border: '#332E2E',
  primary: '#A8C4EA',
  onPrimary: '#14243A',
  success: '#5CD37B',
  danger: '#F87171',
  scrim: 'rgba(0,0,0,0.6)',
  scrimStrong: 'rgba(0,0,0,0.86)',
  overlay: 'rgba(0,0,0,0.45)',
  onOverlay: '#FFFFFF',
};

/// 4pt rhythm. Section spacing uses the named tiers, never an arbitrary number.
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 8, md: 12, lg: 20, pill: 999 } as const;
/// Playfair carries the names — of a person, a city, a screen — and Geist carries the rest.
/// The weight lives in the family, not in fontWeight, which Android ignores on a custom face.
export const type = {
  display: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 32, lineHeight: 40 },
  title: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 22, lineHeight: 30 },
  body: { fontFamily: 'Geist_400Regular', fontSize: 16, lineHeight: 24 },
  label: { fontFamily: 'Geist_600SemiBold', fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: 'Geist_400Regular', fontSize: 13, lineHeight: 18 },
};

export type Colors = typeof light;

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
}
