import { useColorScheme } from 'react-native';

/// Semantic tokens, never raw hex in a screen. Coral carries the primary action, one element at
/// a time, as a flat fill with no glow and no gradient, so the photos stay the loudest thing on
/// the page. Night is the brand surface (the header band, the splash, the icon) and Sky only
/// ever draws decoration. The neutrals are warm paper rather than white, so a card reads as
/// something laid on the page instead of a rectangle drawn by its border.
/// The brand band is the same in both themes: it is the app's name, not a surface that re-tones.
/// Paper on Night is 13.40:1, Sky on Night 11.34:1, Paper on Night Raised 9.05:1.
const brand = {
  night: '#032B43',
  /// A control laid on the band, lighter than it so the button still reads as one.
  nightRaised: '#174763',
  onNight: '#F7F4F1',
  /// Decoration only: the circles on the band, and the subtitle under the band's title.
  sky: '#CFE6EF',
};

/// Every pair below is >= 4.5:1 against the surface it sits on, `surfaceMuted` included —
/// which is the one that catches people out, because it is where the small print lives.
const light = {
  background: '#F7F4F1',
  surface: '#FEFDFC',
  surfaceMuted: '#EFEAE5',
  text: '#1C1A19',
  textMuted: '#6B6560',
  border: '#E6E1DC',
  // Coral. White on it is 5.22:1; as text it is 4.76:1 on Paper and 5.14:1 on Card.
  primary: '#C8324E',
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
  ...brand,
};

/// Dark is a re-tone, not an inversion: the neutrals turn to deep navy under the Night band,
/// and the coral lifts so it stays legible on them instead of sinking in.
const dark: typeof light = {
  background: '#021C2C',
  surface: '#06283D',
  surfaceMuted: '#0B3248',
  text: '#F2F6F8',
  textMuted: '#9FB3C0',
  border: '#16405A',
  // Night on it is 4.66:1; as text it is 5.53:1 on the page and 4.83:1 on Card.
  primary: '#F45D73',
  onPrimary: '#032B43',
  // Both still clear 4.5:1 on the navy, at worst on Sunk (7.07:1 and 4.85:1), so they stay.
  success: '#5CD37B',
  danger: '#F87171',
  scrim: 'rgba(0,0,0,0.6)',
  scrimStrong: 'rgba(0,0,0,0.86)',
  overlay: 'rgba(0,0,0,0.45)',
  onOverlay: '#FFFFFF',
  ...brand,
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
