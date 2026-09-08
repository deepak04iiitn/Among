/**
 * Brand asset paths and sizes — frontend only.
 * Never hardcode the logo filename or pixel sizes in components.
 */

export const BRAND_LOGO = {
  SRC: '/Among_Logo.png',
  ALT: 'AMONG',
  WORDMARK: 'among',
  LINK_ARIA: 'AMONG — go to home',
  INTRINSIC_WIDTH: 438,
  INTRINSIC_HEIGHT: 354,
  NAV_HEIGHT_PX: 36,
  FOOTER_HEIGHT_PX: 80,
} as const;

export function brandLogoWidth(height: number): number {
  return Math.round((height * BRAND_LOGO.INTRINSIC_WIDTH) / BRAND_LOGO.INTRINSIC_HEIGHT);
}
