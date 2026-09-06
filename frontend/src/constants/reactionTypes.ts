// MIRRORED — keep in sync with backend/src/constants/reactionTypes.ts

export interface ReactionType {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly isPrimary: boolean;
}

export const PRIMARY_REACTION_IDS = {
  CURRENT: 'current',
  PAST: 'past',
  CONSIDERING: 'considering',
} as const;

export type PrimaryReactionId =
  (typeof PRIMARY_REACTION_IDS)[keyof typeof PRIMARY_REACTION_IDS];

export const SECONDARY_REACTION_IDS = {
  SAME: 'same',
  I_UNDERSTAND: 'i-understand',
  I_LEARNED: 'i-learned',
  I_DISAGREE: 'i-disagree',
  TELL_ME_MORE: 'tell-me-more',
} as const;

export type SecondaryReactionId =
  (typeof SECONDARY_REACTION_IDS)[keyof typeof SECONDARY_REACTION_IDS];

export type ReactionId = PrimaryReactionId | SecondaryReactionId;

export const PRIMARY_REACTIONS: readonly ReactionType[] = [
  { id: PRIMARY_REACTION_IDS.CURRENT, label: "I'm going through this now", description: 'This experience is current for you.', isPrimary: true },
  { id: PRIMARY_REACTION_IDS.PAST, label: "I've been through this", description: 'You have lived through this experience.', isPrimary: true },
  { id: PRIMARY_REACTION_IDS.CONSIDERING, label: "I'm considering this", description: 'You are thinking about or approaching this experience.', isPrimary: true },
] as const;

export const SECONDARY_REACTIONS: readonly ReactionType[] = [
  { id: SECONDARY_REACTION_IDS.SAME, label: 'Same', description: 'This resonates with you.', isPrimary: false },
  { id: SECONDARY_REACTION_IDS.I_UNDERSTAND, label: 'I understand', description: 'You understand what this person is going through.', isPrimary: false },
  { id: SECONDARY_REACTION_IDS.I_LEARNED, label: 'I learned something', description: 'This gave you a new perspective.', isPrimary: false },
  { id: SECONDARY_REACTION_IDS.I_DISAGREE, label: 'I disagree', description: 'You see this differently.', isPrimary: false },
  { id: SECONDARY_REACTION_IDS.TELL_ME_MORE, label: 'Tell me more', description: 'You want to hear more about this experience.', isPrimary: false },
] as const;

export const ALL_REACTIONS: readonly ReactionType[] = [...PRIMARY_REACTIONS, ...SECONDARY_REACTIONS];

export const REACTION_MAP: Readonly<Record<string, ReactionType>> = Object.fromEntries(
  ALL_REACTIONS.map((r) => [r.id, r])
);
