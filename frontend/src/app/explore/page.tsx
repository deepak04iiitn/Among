/**
 * Public explore — the catalogue of experience rooms.
 * Server-rendered for SEO (FR-SEO-1). One h1. Canonical, OG, JSON-LD.
 */
import type { JSX } from 'react';
import type { Metadata } from 'next';
import { PAGE_META, SITE_URL } from '../../constants/seo';
import { ROUTES } from '../../constants/routes';
import { EXPLORE, allExploreDomainRooms } from '../../constants/explore';
import { buildPageMeta } from '../../utils/seoUtils';
import JsonLd from '../../components/common/JsonLd';
import AppShell from '../../components/layout/AppShell';
import ExploreIndex from '../../components/explore/ExploreIndex';

export const metadata: Metadata = buildPageMeta({
  title:       PAGE_META.EXPLORE.title,
  description: PAGE_META.EXPLORE.description,
  canonical:   ROUTES.EXPLORE,
  keywords:    PAGE_META.EXPLORE.keywords,
});

function buildRoomsItemListJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: EXPLORE.HEADING,
    itemListElement: allExploreDomainRooms().map((category, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: category.displayName,
      url: `${SITE_URL}${ROUTES.EXPLORE_CATEGORY(category.slug)}`,
    })),
  };
}

export default function ExplorePage(): JSX.Element {
  return (
    <AppShell>
      <JsonLd id="ld-explore-rooms" data={buildRoomsItemListJsonLd()} />
      <ExploreIndex />
    </AppShell>
  );
}
