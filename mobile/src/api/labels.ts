import type { Strings } from '@/i18n';

import type { components } from './generated';

export type TimeOfDay = components['schemas']['TimeOfDay'];

/// Every TimeOfDay the API sends, in the order they are offered. Shared, so the onboarding step
/// and the discovery filters cannot drift apart; the words for each are `timeOfDay` in i18n.
export const TIMES_OF_DAY: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night'];

/// What a member's role is called under their name. The API sends the stored value
/// ("entrambi" included); one the app does not know yet is shown as sent rather than dropped.
export function roleName(role: string | undefined, s: Strings) {
  return role && Object.prototype.hasOwnProperty.call(s.roleShown, role)
    ? s.roleShown[role as keyof Strings['roleShown']]
    : (role ?? '');
}
