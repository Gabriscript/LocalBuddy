import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ImagePickerAsset } from 'expo-image-picker';

import { api, unwrap } from './client';
import type { components, paths } from './generated';

type Schemas = components['schemas'];

/// Filters come from the backend's own query signature, so adding one server-side is a
/// compile error here rather than a silently ignored parameter.
export type DiscoveryFilters = NonNullable<paths['/api/v1/discovery']['get']['parameters']['query']>;

/// Query keys live together: an invalidation is only correct if it matches the key that
/// produced the cache entry, and that is impossible to check when they are scattered.
export const keys = {
  me: ['me'] as const,
  profile: (id: string) => ['profile', id] as const,
  discovery: (filters: DiscoveryFilters) => ['discovery', filters] as const,
  conversations: ['conversations'] as const,
  messages: (id: string) => ['messages', id] as const,
};

export function useMe() {
  return useQuery({
    queryKey: keys.me,
    queryFn: async () => unwrap(await api.GET('/api/v1/users/me')),
  });
}

export function useDiscovery(filters: DiscoveryFilters) {
  return useQuery({
    queryKey: keys.discovery(filters),
    queryFn: async () => unwrap(await api.GET('/api/v1/discovery', { params: { query: filters } })),
  });
}

export function useProfile(id: string) {
  return useQuery({
    queryKey: keys.profile(id),
    queryFn: async () => unwrap(await api.GET('/api/v1/users/{id}', { params: { path: { id } } })),
  });
}

export function useConversations() {
  return useQuery({
    queryKey: keys.conversations,
    queryFn: async () => unwrap(await api.GET('/api/v1/conversations')),
  });
}

export function useMessages(id: string) {
  return useQuery({
    queryKey: keys.messages(id),
    queryFn: async () =>
      unwrap(await api.GET('/api/v1/conversations/{id}/messages', { params: { path: { id } } })),
  });
}

export function useSendMessage(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) =>
      unwrap(
        await api.POST('/api/v1/conversations/{id}/messages', {
          params: { path: { id } },
          body: { content },
        })
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: keys.messages(id) });
      client.invalidateQueries({ queryKey: keys.conversations });
    },
  });
}

/// Interest and pass both remove the target from discovery, so both drop the whole
/// discovery cache regardless of which filters produced it.
export function useDecide() {
  const client = useQueryClient();
  const forget = () => client.invalidateQueries({ queryKey: ['discovery'] });

  const interest = useMutation({
    mutationFn: async (targetId: string) =>
      unwrap(await api.POST('/api/v1/users/{targetId}/interest', { params: { path: { targetId } } })),
    onSuccess: () => {
      forget();
      client.invalidateQueries({ queryKey: keys.conversations });
    },
  });

  const pass = useMutation({
    mutationFn: async (targetId: string) =>
      unwrap(await api.POST('/api/v1/users/{targetId}/pass', { params: { path: { targetId } } })),
    onSuccess: forget,
  });

  return { interest, pass };
}

// ---- Onboarding writes ------------------------------------------------------------------
// Each one refreshes `me` on success, so every screen that shows the member's own profile
// picks the change up without being told about it.

function useMeMutation<TInput, TResult>(write: (input: TInput) => Promise<TResult>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: write,
    onSuccess: () => client.invalidateQueries({ queryKey: keys.me }),
  });
}

/// The document check itself happens with the provider first; this records the verdict.
/// In Development the backend's fake verifier approves every account.
export function useVerify() {
  return useMeMutation(async () => unwrap(await api.POST('/api/v1/users/me/verify')));
}

export function useUpdateProfile() {
  return useMeMutation(async (body: Schemas['ProfileUpdate']) =>
    unwrap(await api.PUT('/api/v1/users/me', { body }))
  );
}

export function useSetAvailability() {
  return useMeMutation(async (body: Schemas['AvailabilitySlot'][]) =>
    unwrap(await api.PUT('/api/v1/users/me/availability', { body }))
  );
}

export function useUpsertListing() {
  return useMeMutation(async (body: Schemas['ListingUpdate']) =>
    unwrap(await api.PUT('/api/v1/listings/me', { body }))
  );
}

export function useDeletePhoto() {
  return useMeMutation(async (id: string) =>
    unwrap(await api.DELETE('/api/v1/photos/{id}', { params: { path: { id } } }))
  );
}

/// PhotoType on the wire: 0 = profile, 1 = home (only for hosts offering overnight).
export function useUploadPhoto() {
  return useMeMutation(async ({ asset, type }: { asset: ImagePickerAsset; type: 0 | 1 }) => {
    const form = new FormData();
    // The web picker hands over a real File; native platforms give a file URI, which React
    // Native's FormData uploads when it is passed in this { uri, name, type } shape.
    if (asset.file) form.append('file', asset.file);
    else
      form.append('file', {
        uri: asset.uri,
        name: asset.fileName ?? 'photo.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      } as unknown as Blob);

    return unwrap(
      await api.POST('/api/v1/photos', { params: { query: { type } }, body: form as never })
    );
  });
}
