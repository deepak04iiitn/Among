/**
 * Public landing — the AMONG homepage.
 * Server-rendered for SEO (FR-SEO-1). One h1. Canonical, OG, JSON-LD.
 *
 * Visual language: Warm Linen literary issue — not a SaaS template.
 * Spec tokens: /docs/theme.md. Copy: frontend/src/constants/landing.ts.
 */
import type { JSX } from 'react';
import type { Metadata } from 'next';
import { PAGE_META } from '../constants/seo';
import { ROUTES } from '../constants/routes';
import { LANDING } from '../constants/landing';
import { buildPageMeta, buildOrganizationJsonLd, buildWebSiteJsonLd, buildFaqPageJsonLd } from '../utils/seoUtils';
import JsonLd from '../components/common/JsonLd';
import Navigation from '../components/layout/Navigation';
import Footer from '../components/layout/Footer';
import LandingHero from '../components/landing/LandingHero';
import LandingManifesto from '../components/landing/LandingManifesto';
import LandingHowItWorks from '../components/landing/LandingHowItWorks';
import LandingExperiences from '../components/landing/LandingExperiences';
import LandingContrast from '../components/landing/LandingContrast';
import LandingSafety from '../components/landing/LandingSafety';
import LandingFaq from '../components/landing/LandingFaq';
import LandingClose from '../components/landing/LandingClose';

export const metadata: Metadata = buildPageMeta({
  title:       PAGE_META.LANDING.title,
  description: PAGE_META.LANDING.description,
  canonical:   ROUTES.LANDING,
  keywords:    PAGE_META.LANDING.keywords,
});

export default function LandingPage(): JSX.Element {
  return (
    <>
      <JsonLd id="ld-website" data={buildWebSiteJsonLd()} />
      <JsonLd id="ld-organization" data={buildOrganizationJsonLd()} />
      <JsonLd id="ld-faq" data={buildFaqPageJsonLd(LANDING.FAQ_ITEMS)} />

      <div className="min-h-dvh flex flex-col bg-bg">
        <Navigation />

        <main id="main-content" tabIndex={-1}>
          <LandingHero />
          <LandingManifesto />
          <LandingHowItWorks />
          <LandingExperiences />
          <LandingContrast />
          <LandingSafety />
          <LandingFaq />
          <LandingClose />
        </main>

        <Footer />
      </div>
    </>
  );
}
