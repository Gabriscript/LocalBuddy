/// TimeOfDay travels as a number (0 morning, 1 afternoon, 2 evening, 3 night); these are the
/// words for it. Shared, so the onboarding step and the discovery filters cannot drift apart.
export const TIMES_OF_DAY = [
  { value: 0, label: 'Morning' },
  { value: 1, label: 'Afternoon' },
  { value: 2, label: 'Evening' },
  { value: 3, label: 'Night' },
];
