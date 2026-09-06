// Backend-only — crisis resource definitions surfaced when crisis content is detected.
// Never hardcode resource links inline in services — always import from here.

export interface CrisisResource {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly url: string;
  readonly phone?: string;
  readonly availableIn: readonly string[]; // ISO country codes, or ['*'] for global
}

export const CRISIS_TYPE = {
  SELF_HARM: 'self_harm',
  HARM_TO_OTHERS: 'harm_to_others',
  GENERAL: 'general',
} as const;

export type CrisisType = (typeof CRISIS_TYPE)[keyof typeof CRISIS_TYPE];

export const CRISIS_RESOURCES: Readonly<Record<CrisisType, readonly CrisisResource[]>> = {
  [CRISIS_TYPE.SELF_HARM]: [
    {
      id: 'international-association-suicide-prevention',
      name: 'International Association for Suicide Prevention',
      description: 'Directory of crisis centres worldwide.',
      url: 'https://www.iasp.info/resources/Crisis_Centres/',
      availableIn: ['*'],
    },
    {
      id: 'crisis-text-line',
      name: 'Crisis Text Line',
      description: 'Text HOME to 741741 for free, 24/7 crisis support.',
      url: 'https://www.crisistextline.org',
      phone: '741741',
      availableIn: ['US', 'CA', 'UK', 'IE'],
    },
    {
      id: 'befrienders-worldwide',
      name: 'Befrienders Worldwide',
      description: 'Emotional support — find your local centre.',
      url: 'https://www.befrienders.org',
      availableIn: ['*'],
    },
  ],
  [CRISIS_TYPE.HARM_TO_OTHERS]: [
    {
      id: 'emergency-services',
      name: 'Emergency Services',
      description: 'If someone is in immediate danger, contact your local emergency services.',
      url: 'https://en.wikipedia.org/wiki/List_of_emergency_telephone_numbers',
      availableIn: ['*'],
    },
  ],
  [CRISIS_TYPE.GENERAL]: [
    {
      id: 'international-association-suicide-prevention',
      name: 'International Association for Suicide Prevention',
      description: 'Directory of crisis centres worldwide.',
      url: 'https://www.iasp.info/resources/Crisis_Centres/',
      availableIn: ['*'],
    },
  ],
};

/** Returns resources for a given crisis type, falling back to GENERAL */
export function getCrisisResources(type: CrisisType): readonly CrisisResource[] {
  return CRISIS_RESOURCES[type] ?? CRISIS_RESOURCES[CRISIS_TYPE.GENERAL];
}
