import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
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
  conversation: (id: string) => ['conversation', id] as const,
  messages: (id: string) => ['messages', id] as const,
  reviews: (id: string) => ['reviews', id] as const,
  blocks: ['blocks'] as const,
  paymentOptions: ['payment-options'] as const,
};

/// Every paged endpoint answers with `items` and `hasMore` (ADR-0008), and those two are all it
/// takes to walk one. Until this existed the client only ever read page 0: a conversation
/// longer than one page could not be scrolled back through at all.
type PageOf<T> = { items: T[]; hasMore: boolean };

/// The page number is counted here rather than read back off the response, which types it as
/// `number | string`. One helper for all five paged lists, so none of them can drift.
function usePages<T>(queryKey: readonly unknown[], load: (page: number) => Promise<PageOf<T>>) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => load(pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, _pages, lastPageParam) =>
      last.hasMore ? lastPageParam + 1 : undefined,
  });

  // Memoised: a fresh array on every render is a fresh `data` prop for every FlatList, which
  // then cannot skip a single row. The cost grew with how far somebody had scrolled.
  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data]
  );

  return {
    ...query,
    /// Flattened, so a screen never has to know how many requests it took.
    items,
    /// Safe to hand straight to onEndReached, which fires more than once per end of list.
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
    },
  };
}

export function useMe() {
  return useQuery({
    queryKey: keys.me,
    queryFn: async () => unwrap(await api.GET('/api/v1/users/me')),
  });
}

export function useDiscovery(filters: DiscoveryFilters) {
  return usePages(keys.discovery(filters), async (page) =>
    unwrap(await api.GET('/api/v1/discovery', { params: { query: { ...filters, page } } }))
  );
}

/// The id is optional because the chat screen only learns who it is talking to once the
/// conversation list has arrived.
export function useProfile(id: string | undefined) {
  return useQuery({
    queryKey: keys.profile(id ?? ''),
    queryFn: async () =>
      unwrap(await api.GET('/api/v1/users/{id}', { params: { path: { id: id! } } })),
    enabled: !!id,
  });
}

export function useConversations() {
  return usePages(keys.conversations, async (page) =>
    unwrap(await api.GET('/api/v1/conversations', { params: { query: { page } } }))
  );
}

/// The one conversation a chat screen is on. Asking for it directly rather than hunting for it
/// in the paged inbox is what keeps the other member's name — and with it the report and block
/// controls — available in a conversation that has fallen past the first page.
export function useConversation(id: string) {
  return useQuery({
    queryKey: keys.conversation(id),
    queryFn: async () =>
      unwrap(await api.GET('/api/v1/conversations/{id}', { params: { path: { id } } })),
  });
}

/// Page 0 is the newest messages, which is why the list showing them is inverted: reaching the
/// visual top is reaching the end of the data, and asks for the page before.
export function useMessages(id: string) {
  return usePages(keys.messages(id), async (page) =>
    unwrap(
      await api.GET('/api/v1/conversations/{id}/messages', {
        params: { path: { id }, query: { page } },
      })
    )
  );
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
      // The summary carries the last message, so it is stale the moment one is sent.
      client.invalidateQueries({ queryKey: keys.conversation(id) });
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

// ---- Paying to skip the match -------------------------------------------------------------

/// What the next unlock will cost this member. Prices come from the server, never from a
/// constant in here: two copies of a price is how an app shows one number and charges another.
export function usePaymentOptions() {
  return useQuery({
    queryKey: keys.paymentOptions,
    queryFn: async () => unwrap(await api.GET('/api/v1/payments/options')),
  });
}

/// Opens a conversation without waiting for the other side. The result says what was actually
/// charged: one-time, credits, subscription, or none when the chat was already open.
export function useUnlock() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (targetId: string) =>
      unwrap(await api.POST('/api/v1/users/{targetId}/unlock', { params: { path: { targetId } } })),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: keys.conversations });
      // Credits may have gone down, and they are shown on the member's own profile.
      client.invalidateQueries({ queryKey: keys.me });
      client.invalidateQueries({ queryKey: keys.paymentOptions });
      client.invalidateQueries({ queryKey: ['discovery'] });
    },
  });
}

// ---- Safety and reviews -------------------------------------------------------------------

export function useReviews(userId: string) {
  return usePages(keys.reviews(userId), async (page) =>
    unwrap(
      await api.GET('/api/v1/users/{userId}/reviews', {
        params: { path: { userId }, query: { page } },
      })
    )
  );
}

/// A review moves the subject's rating, so their profile and their card in the feed are both
/// stale the moment it lands.
export function useCreateReview(subjectId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (body: { rating: number; comment: string }) =>
      unwrap(await api.POST('/api/v1/reviews', { body: { subjectId, ...body } })),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: keys.reviews(subjectId) });
      client.invalidateQueries({ queryKey: keys.profile(subjectId) });
      client.invalidateQueries({ queryKey: ['discovery'] });
    },
  });
}

/// 202, not 201: the report goes into a queue for a human, and the reporter gets no handle to
/// read it back with.
export function useReport() {
  return useMutation({
    mutationFn: async ({ reportedId, reason }: { reportedId: string; reason: string }) =>
      unwrap(await api.POST('/api/v1/reports', { body: { reportedId, reason } })),
  });
}

/// A block takes the member out of the feed, the inbox and their own profile page at once, so
/// every list is stale afterwards. Unblocking puts them back.
export function useBlock() {
  const client = useQueryClient();
  const forget = () => {
    client.invalidateQueries({ queryKey: ['discovery'] });
    client.invalidateQueries({ queryKey: keys.conversations });
    // A block takes the conversation out of reach one by one as well as in the list.
    client.invalidateQueries({ queryKey: ['conversation'] });
    client.invalidateQueries({ queryKey: keys.blocks });
  };

  const block = useMutation({
    mutationFn: async (userId: string) =>
      unwrap(await api.PUT('/api/v1/users/{userId}/block', { params: { path: { userId } } })),
    onSuccess: forget,
  });

  const unblock = useMutation({
    mutationFn: async (userId: string) =>
      unwrap(await api.DELETE('/api/v1/users/{userId}/block', { params: { path: { userId } } })),
    onSuccess: forget,
  });

  return { block, unblock };
}

/// The only screen a blocked member still appears on, which is what makes a block undoable.
export function useBlocks() {
  return usePages(keys.blocks, async (page) =>
    unwrap(await api.GET('/api/v1/users/me/blocks', { params: { query: { page } } }))
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
