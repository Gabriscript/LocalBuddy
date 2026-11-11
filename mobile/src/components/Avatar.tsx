import { View, type StyleProp, type ViewStyle } from 'react-native';

import { AuthedImage } from './AuthedImage';

/// Member photos are landscape or square with the face above the middle, so a plain cover crop
/// fills a small circle with scenery: draw the photo larger and slide the window up to the face.
const ZOOM = 1.6;
const FOCUS = 0.08;

type Props = {
  path: string | null | undefined;
  /// Diameter in dp.
  size: number;
  /// `thumb` (256 px) is sharp up to about 56 dp; anything larger wants `medium`.
  photoSize: 'thumb' | 'medium';
  /// The circle itself: background, border.
  style?: StyleProp<ViewStyle>;
  'aria-hidden'?: boolean;
  accessibilityLabel?: string;
};

/// A circular member photo, face-centred. Still rendered through AuthedImage, the only way a
/// member photo may be drawn.
export function Avatar({ path, size, photoSize, style, 'aria-hidden': ariaHidden, accessibilityLabel }: Props) {
  const offset = ((ZOOM - 1) / 2) * size;
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }, style]}>
      <AuthedImage
        path={path}
        size={photoSize}
        aria-hidden={ariaHidden}
        accessibilityLabel={accessibilityLabel}
        style={{ position: 'absolute', width: size * ZOOM, height: size * ZOOM, left: -offset, top: -offset - FOCUS * size }}
      />
    </View>
  );
}
