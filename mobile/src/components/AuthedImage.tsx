import { Image, type ImageProps } from 'expo-image';

import { API_URL, authHeaders } from '@/api/client';

type Props = Omit<ImageProps, 'source'> & { path: string | null | undefined };

/// The only way a member photo may be rendered. GET /api/v1/photos/{id}/content answers 404
/// instead of the image when the caller is not allowed to see it, and an <Image> with a bare
/// URL sends no Authorization header — so it would 404 for every restricted profile.
export function AuthedImage({ path, ...rest }: Props) {
  return (
    <Image
      contentFit="cover"
      cachePolicy="memory-disk"
      // Short crossfade instead of a photo snapping in; the reserved box never changes size,
      // so this cannot shift the layout.
      transition={200}
      {...rest}
      source={path ? { uri: `${API_URL}${path}`, headers: authHeaders() } : null}
    />
  );
}
