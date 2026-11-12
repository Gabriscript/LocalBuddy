import type { Strings } from '@/i18n';

import type { components } from './generated';

export type TimeOfDay = components['schemas']['TimeOfDay'];

/// Every TimeOfDay the API sends, in the order they are offered. Shared, so the onboarding step
/// and the discovery filters cannot drift apart; the words for each are `timeOfDay` in i18n.
export const TIMES_OF_DAY: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night'];

export type DayOfWeek = components['schemas']['DayOfWeek'];
export type ActivityStyle = NonNullable<components['schemas']['ActivityStyle']>;
export type Lifestyle = NonNullable<components['schemas']['Lifestyle']>;

/// Monday first, the way a week reads in every language the app speaks. Words: `days` in i18n.
export const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
export const ACTIVITY_STYLES: ActivityStyle[] = ['relaxed', 'adventurous'];
export const LIFESTYLES: Lifestyle[] = ['nightlife', 'family'];
/// Ionicons names for the profile pills.
export const STYLE_ICON = { relaxed: 'leaf-outline', adventurous: 'flash-outline' } as const;
export const LIFE_ICON = { nightlife: 'moon-outline', family: 'people-outline' } as const;

/// What a member's role is called under their name. The API sends the stored value
/// ("entrambi" included); one the app does not know yet is shown as sent rather than dropped.
export function roleName(role: string | undefined, s: Strings) {
  return role && Object.prototype.hasOwnProperty.call(s.roleShown, role)
    ? s.roleShown[role as keyof Strings['roleShown']]
    : (role ?? '');
}
