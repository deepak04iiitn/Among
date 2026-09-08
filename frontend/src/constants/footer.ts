/**
 * Footer copy and chrome — frontend only.
 * Never send these strings to the API.
 */
import { ROUTES } from './routes';

export const FOOTER_COPY = {
  ARIA_LABEL:    'Site footer',
  STATEMENT:     'You have been through things no one else knows. Someone else is going through them right now.',
  PS_HEADING:    'P.S.',
  COLOPHON_NAV:  'Colophon',
} as const;

export const FOOTER_PLATFORM_LINKS = [
  { href: ROUTES.ABOUT,      label: 'About' },
  { href: ROUTES.GUIDELINES, label: 'Guidelines' },
  { href: ROUTES.HELP,       label: 'Help' },
] as const;

export const FOOTER_LEGAL_LINKS = [
  { href: ROUTES.PRIVACY, label: 'Privacy' },
  { href: ROUTES.TERMS,   label: 'Terms' },
] as const;

export const FOOTER_COLOPHON_LINKS = [
  ...FOOTER_PLATFORM_LINKS,
  ...FOOTER_LEGAL_LINKS,
] as const;

export function footerCopyright(year: number): string {
  return `© ${year} Among. All rights reserved.`;
}
