import type { components } from './generated';

export type TimeOfDay = components['schemas']['TimeOfDay'];

/// The words for each TimeOfDay the API sends. Shared, so the onboarding step and the discovery
/// filters cannot drift apart.
export const TIMES_OF_DAY: { value: TimeOfDay; label: string }[] = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'night', label: 'Night' },
];
