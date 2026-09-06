// MIRRORED — keep in sync with backend/src/constants/experienceCategories.ts

export interface ExperienceCategory {
  readonly id: string;
  readonly slug: string;
  readonly displayName: string;
  readonly description: string;
  readonly relatedCategoryIds: readonly string[];
  readonly isThingsICantSay: boolean;
}

export const EXPERIENCE_CATEGORY_IDS = {
  RELATIONSHIPS: 'relationships',
  WORK: 'work',
  MONEY: 'money',
  FAMILY: 'family',
  FRIENDSHIP: 'friendship',
  LONELINESS: 'loneliness',
  IDENTITY: 'identity',
  LIFE_CHANGES: 'life-changes',
  FAILURE: 'failure',
  SUCCESS: 'success',
  FEAR: 'fear',
  REGRET: 'regret',
  TRAVEL: 'travel',
  HEALTH: 'health',
  THINGS_I_CANT_SAY: 'things-i-cant-say',
} as const;

export type ExperienceCategoryId =
  (typeof EXPERIENCE_CATEGORY_IDS)[keyof typeof EXPERIENCE_CATEGORY_IDS];

export const EXPERIENCE_CATEGORIES: readonly ExperienceCategory[] = [
  {
    id: EXPERIENCE_CATEGORY_IDS.RELATIONSHIPS,
    slug: 'relationships',
    displayName: 'Relationships',
    description: 'Romantic connections, breakups, love, and partnership.',
    relatedCategoryIds: [
      EXPERIENCE_CATEGORY_IDS.LONELINESS,
      EXPERIENCE_CATEGORY_IDS.FAMILY,
      EXPERIENCE_CATEGORY_IDS.IDENTITY,
    ],
    isThingsICantSay: false,
  },
  {
    id: EXPERIENCE_CATEGORY_IDS.WORK,
    slug: 'work',
    displayName: 'Work',
    description: 'Career uncertainty, burnout, workplace dynamics, and professional life.',
    relatedCategoryIds: [
      EXPERIENCE_CATEGORY_IDS.MONEY,
      EXPERIENCE_CATEGORY_IDS.FAILURE,
      EXPERIENCE_CATEGORY_IDS.LIFE_CHANGES,
    ],
    isThingsICantSay: false,
  },
  {
    id: EXPERIENCE_CATEGORY_IDS.MONEY,
    slug: 'money',
    displayName: 'Money',
    description: 'Financial stress, debt, security, and the anxiety of not having enough.',
    relatedCategoryIds: [
      EXPERIENCE_CATEGORY_IDS.WORK,
      EXPERIENCE_CATEGORY_IDS.FEAR,
      EXPERIENCE_CATEGORY_IDS.LIFE_CHANGES,
    ],
    isThingsICantSay: false,
  },
  {
    id: EXPERIENCE_CATEGORY_IDS.FAMILY,
    slug: 'family',
    displayName: 'Family',
    description: 'Parents, siblings, children, and the complicated weight of family.',
    relatedCategoryIds: [
      EXPERIENCE_CATEGORY_IDS.RELATIONSHIPS,
      EXPERIENCE_CATEGORY_IDS.IDENTITY,
      EXPERIENCE_CATEGORY_IDS.REGRET,
    ],
    isThingsICantSay: false,
  },
  {
    id: EXPERIENCE_CATEGORY_IDS.FRIENDSHIP,
    slug: 'friendship',
    displayName: 'Friendship',
    description: 'Friendships drifting, found, lost, or complicated.',
    relatedCategoryIds: [
      EXPERIENCE_CATEGORY_IDS.LONELINESS,
      EXPERIENCE_CATEGORY_IDS.RELATIONSHIPS,
      EXPERIENCE_CATEGORY_IDS.IDENTITY,
    ],
    isThingsICantSay: false,
  },
  {
    id: EXPERIENCE_CATEGORY_IDS.LONELINESS,
    slug: 'loneliness',
    displayName: 'Loneliness',
    description: 'Feeling alone — in a crowd, in a relationship, or simply in life.',
    relatedCategoryIds: [
      EXPERIENCE_CATEGORY_IDS.RELATIONSHIPS,
      EXPERIENCE_CATEGORY_IDS.FRIENDSHIP,
      EXPERIENCE_CATEGORY_IDS.IDENTITY,
    ],
    isThingsICantSay: false,
  },
  {
    id: EXPERIENCE_CATEGORY_IDS.IDENTITY,
    slug: 'identity',
    displayName: 'Identity',
    description: 'Who you are, who you were, and who you are becoming.',
    relatedCategoryIds: [
      EXPERIENCE_CATEGORY_IDS.LONELINESS,
      EXPERIENCE_CATEGORY_IDS.FAMILY,
      EXPERIENCE_CATEGORY_IDS.LIFE_CHANGES,
    ],
    isThingsICantSay: false,
  },
  {
    id: EXPERIENCE_CATEGORY_IDS.LIFE_CHANGES,
    slug: 'life-changes',
    displayName: 'Life Changes',
    description: 'Major transitions — moving, starting over, ending a chapter.',
    relatedCategoryIds: [
      EXPERIENCE_CATEGORY_IDS.WORK,
      EXPERIENCE_CATEGORY_IDS.IDENTITY,
      EXPERIENCE_CATEGORY_IDS.FEAR,
    ],
    isThingsICantSay: false,
  },
  {
    id: EXPERIENCE_CATEGORY_IDS.FAILURE,
    slug: 'failure',
    displayName: 'Failure',
    description: 'Things that did not go as planned, and living with that.',
    relatedCategoryIds: [
      EXPERIENCE_CATEGORY_IDS.WORK,
      EXPERIENCE_CATEGORY_IDS.REGRET,
      EXPERIENCE_CATEGORY_IDS.FEAR,
    ],
    isThingsICantSay: false,
  },
  {
    id: EXPERIENCE_CATEGORY_IDS.SUCCESS,
    slug: 'success',
    displayName: 'Success',
    description: "Achieving something — and everything complicated that comes after.",
    relatedCategoryIds: [
      EXPERIENCE_CATEGORY_IDS.WORK,
      EXPERIENCE_CATEGORY_IDS.IDENTITY,
      EXPERIENCE_CATEGORY_IDS.LIFE_CHANGES,
    ],
    isThingsICantSay: false,
  },
  {
    id: EXPERIENCE_CATEGORY_IDS.FEAR,
    slug: 'fear',
    displayName: 'Fear',
    description: 'What keeps you up at night, what holds you back, what you face alone.',
    relatedCategoryIds: [
      EXPERIENCE_CATEGORY_IDS.MONEY,
      EXPERIENCE_CATEGORY_IDS.FAILURE,
      EXPERIENCE_CATEGORY_IDS.HEALTH,
    ],
    isThingsICantSay: false,
  },
  {
    id: EXPERIENCE_CATEGORY_IDS.REGRET,
    slug: 'regret',
    displayName: 'Regret',
    description: 'Choices made, paths not taken, and what you carry because of them.',
    relatedCategoryIds: [
      EXPERIENCE_CATEGORY_IDS.FAILURE,
      EXPERIENCE_CATEGORY_IDS.FAMILY,
      EXPERIENCE_CATEGORY_IDS.RELATIONSHIPS,
    ],
    isThingsICantSay: false,
  },
  {
    id: EXPERIENCE_CATEGORY_IDS.TRAVEL,
    slug: 'travel',
    displayName: 'Travel',
    description: 'Being somewhere new, feeling displaced, and what movement does to a person.',
    relatedCategoryIds: [
      EXPERIENCE_CATEGORY_IDS.LIFE_CHANGES,
      EXPERIENCE_CATEGORY_IDS.LONELINESS,
      EXPERIENCE_CATEGORY_IDS.IDENTITY,
    ],
    isThingsICantSay: false,
  },
  {
    id: EXPERIENCE_CATEGORY_IDS.HEALTH,
    slug: 'health',
    displayName: 'Health',
    description: 'Living with a body or mind that is difficult, uncertain, or changing.',
    relatedCategoryIds: [
      EXPERIENCE_CATEGORY_IDS.FEAR,
      EXPERIENCE_CATEGORY_IDS.IDENTITY,
      EXPERIENCE_CATEGORY_IDS.LIFE_CHANGES,
    ],
    isThingsICantSay: false,
  },
  {
    id: EXPERIENCE_CATEGORY_IDS.THINGS_I_CANT_SAY,
    slug: 'things-i-cant-say',
    displayName: "Things I Can't Say",
    description: "What you cannot say anywhere else. No judgment. No explanation needed.",
    relatedCategoryIds: [],
    isThingsICantSay: true,
  },
] as const;

export const EXPERIENCE_CATEGORY_MAP: Readonly<Record<string, ExperienceCategory>> =
  Object.fromEntries(EXPERIENCE_CATEGORIES.map((cat) => [cat.id, cat]));

export const VALID_CATEGORY_IDS: ReadonlySet<string> = new Set(
  EXPERIENCE_CATEGORIES.map((cat) => cat.id)
);

export const THINGS_I_CANT_SAY_ID = EXPERIENCE_CATEGORY_IDS.THINGS_I_CANT_SAY;
