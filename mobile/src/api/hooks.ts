import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, unwrap } from './client';
import type { paths } from './generated';

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
