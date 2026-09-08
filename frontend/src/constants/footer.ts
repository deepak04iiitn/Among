/**
 * Footer copy and chrome — frontend only.
 * Never send these strings to the API.
 */
import { ROUTES } from './routes';

export const FOOTER_COPY = {
  ARIA_LABEL:     'Site footer',
  KICKER:         'Endpaper',
  STATEMENT:
    'You have been through things no one else knows. Someone else is going through them right now.',
  PLATFORM_NAV:   'Platform pages',
  PLATFORM_HEADING: 'The house',
  ROOMS_NAV:      'Experience rooms',
  ROOMS_HEADING:  'Every room',
  LEGAL_NAV:      'Legal',
  LEGAL_HEADING:  'Fine print',
  CTA:            'Enter Among →',
  CTA_ARIA:       'Go to the AMONG homepage',
} as const;

export const FOOTER_PLATFORM_LINKS = [
  { href: ROUTES.EXPLORE,    label: 'Explore' },
  { href: ROUTES.ABOUT,      label: 'About' },
  { href: ROUTES.GUIDELINES, label: 'Guidelines' },
  { href: ROUTES.HELP,       label: 'Help' },
  { href: ROUTES.SITEMAP,    label: 'Sitemap' },
] as const;

export const FOOTER_LEGAL_LINKS = [
  { href: ROUTES.PRIVACY, label: 'Privacy' },
  { href: ROUTES.TERMS,   label: 'Terms' },
] as const;

export function footerCopyright(year: number): string {
  return `© ${year} Among. All rights reserved.`;
}
