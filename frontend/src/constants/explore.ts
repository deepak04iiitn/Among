/**
 * Public Explore page copy — frontend only.
 * Never inline these strings in components.
 */
import { ROUTES } from './routes';
import {
  EXPERIENCE_CATEGORY_IDS,
  EXPERIENCE_CATEGORY_MAP,
  type ExperienceCategory,
} from './experienceCategories';

export const EXPLORE = {
  KICKER: 'Explore',
  HEADING: 'The rooms.',
  LEDE:
    'You can enter without an account. These are not tags for a feed. They are the public rooms of AMONG — anonymous lived experiences, organized by the life they belong to.',
  REGION: 'Experience rooms',
  MORE_KICKER: 'More from AMONG',
  MORE_HEADING: 'The rest of the issue.',
  MORE_ARIA: 'More from AMONG',
  ABOUT: 'About AMONG',
  ABOUT_LINE: 'Why this network exists, and what it refuses to be.',
  GUIDELINES: 'Community guidelines',
  GUIDELINES_LINE: 'How the rooms stay honest, and how we keep them safe.',
  HELP: 'Help',
  HELP_LINE: 'Quiet answers — anonymity, conversations, and support.',
  ROOM_ARIA: (displayName: string): string =>
    `Explore anonymous ${displayName} experiences`,
  CHAPTER_ARIA: (title: string): string => `${title} rooms`,
  CONTENTS_KICKER: 'Contents',
  CONTENTS_ARIA: 'Chapters in this book',
  CONTENTS_ITEM_ARIA: (numeral: string, title: string): string =>
    `${numeral} ${title}`,
} as const;

export const EXPLORE_MORE = [
  {
    href: ROUTES.ABOUT,
    label: EXPLORE.ABOUT,
    line: EXPLORE.ABOUT_LINE,
  },
  {
    href: ROUTES.GUIDELINES,
    label: EXPLORE.GUIDELINES,
    line: EXPLORE.GUIDELINES_LINE,
  },
  {
    href: ROUTES.HELP,
    label: EXPLORE.HELP,
    line: EXPLORE.HELP_LINE,
  },
] as const;

export const EXPLORE_DOMAINS = [
  {
    id: 'the-others',
    numeral: 'I',
    title: 'The others',
    categoryIds: [
      EXPERIENCE_CATEGORY_IDS.RELATIONSHIPS,
      EXPERIENCE_CATEGORY_IDS.FAMILY,
      EXPERIENCE_CATEGORY_IDS.FRIENDSHIP,
      EXPERIENCE_CATEGORY_IDS.LONELINESS,
    ],
  },
  {
    id: 'the-days',
    numeral: 'II',
    title: 'The days',
    categoryIds: [
      EXPERIENCE_CATEGORY_IDS.WORK,
      EXPERIENCE_CATEGORY_IDS.MONEY,
      EXPERIENCE_CATEGORY_IDS.HEALTH,
      EXPERIENCE_CATEGORY_IDS.LIFE_CHANGES,
      EXPERIENCE_CATEGORY_IDS.TRAVEL,
    ],
  },
  {
    id: 'the-inward-rooms',
    numeral: 'III',
    title: 'The inward rooms',
    categoryIds: [
      EXPERIENCE_CATEGORY_IDS.IDENTITY,
      EXPERIENCE_CATEGORY_IDS.FEAR,
      EXPERIENCE_CATEGORY_IDS.REGRET,
      EXPERIENCE_CATEGORY_IDS.FAILURE,
      EXPERIENCE_CATEGORY_IDS.SUCCESS,
      EXPERIENCE_CATEGORY_IDS.THINGS_I_CANT_SAY,
    ],
  },
] as const;

export function roomsForDomain(categoryIds: readonly string[]): ExperienceCategory[] {
  return categoryIds.flatMap((id) => {
    const room = EXPERIENCE_CATEGORY_MAP[id];
    return room === undefined ? [] : [room];
  });
}

export function allExploreDomainRooms(): ExperienceCategory[] {
  return EXPLORE_DOMAINS.flatMap((domain) => roomsForDomain(domain.categoryIds));
}

export function exploreChapterId(domainId: string): string {
  return `explore-chapter-${domainId}`;
}

export function exploreChapterHref(domainId: string): string {
  return `#${exploreChapterId(domainId)}`;
}
