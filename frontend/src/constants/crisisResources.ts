// MIRRORED — keep in sync with backend/src/constants/crisisResources.ts
// Frontend-facing crisis resource constants for CrisisResourceBanner.

export interface CrisisResource {
  readonly name:        string;
  readonly description: string;
  readonly url?:        string;
  readonly phone?:      string;
  readonly available:   string;
}

export const CRISIS_RESOURCES: readonly CrisisResource[] = [
  {
    name:        'International Association for Suicide Prevention',
    description: 'Directory of crisis centres worldwide.',
    url:         'https://www.iasp.info/resources/Crisis_Centres/',
    available:   '24/7',
  },
  {
    name:        'Crisis Text Line',
    description: 'Text HOME to 741741 for free crisis support.',
    phone:       '741741 (text HOME)',
    url:         'https://www.crisistextline.org',
    available:   '24/7 (US, CA, UK, IE)',
  },
  {
    name:        'Befrienders Worldwide',
    description: 'Emotional support — find your local centre.',
    url:         'https://www.befrienders.org',
    available:   'Varies by location',
  },
];
