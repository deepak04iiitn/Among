/**
 * seoUtils.test.ts — Unit tests for SEO metadata generation utilities.
 *
 * Critical invariants:
 *  - Every page gets unique title and description.
 *  - Canonical URLs are always present.
 *  - OG tags mirror the title/description.
 *  - BreadcrumbList JSON-LD has correct position ordering.
 *  - Organization JSON-LD has required schema.org fields.
 */
import {
  buildPageMeta,
  buildBreadcrumbJsonLd,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  buildFaqPageJsonLd,
} from './seoUtils';

describe('buildPageMeta', () => {
  it('returns correct title and description', () => {
    const meta = buildPageMeta({
      title:       'Test page',
      description: 'A test description',
      canonical:   '/test',
    });
    expect(meta.title).toBe('Test page');
    expect(meta.description).toBe('A test description');
  });

  it('sets canonical in alternates', () => {
    const meta = buildPageMeta({
      title:       'T',
      description: 'D',
      canonical:   '/explore',
    });
    expect((meta.alternates as { canonical: string }).canonical).toBe('/explore');
  });

  it('sets openGraph title and description', () => {
    const meta = buildPageMeta({
      title:       'Page title',
      description: 'Page desc',
      canonical:   '/page',
    });
    expect((meta.openGraph as { title: string; description: string }).title).toBe('Page title');
    expect((meta.openGraph as { title: string; description: string }).description).toBe('Page desc');
  });

  it('uses ogTitle override when provided', () => {
    const meta = buildPageMeta({
      title:       'Long page title for heading',
      description: 'desc',
      canonical:   '/page',
      ogTitle:     'Short OG title',
    });
    expect((meta.openGraph as { title: string }).title).toBe('Short OG title');
  });

  it('sets noindex robots when noIndex=true', () => {
    const meta = buildPageMeta({
      title:       'Private',
      description: 'private',
      canonical:   '/private',
      noIndex:     true,
    });
    const robots = meta.robots as { index: boolean; follow: boolean };
    expect(robots.index).toBe(false);
    expect(robots.follow).toBe(false);
  });

  it('sets index+follow robots by default', () => {
    const meta = buildPageMeta({ title: 'T', description: 'D', canonical: '/t' });
    const robots = meta.robots as { index: boolean; follow: boolean };
    expect(robots.index).toBe(true);
    expect(robots.follow).toBe(true);
  });

  it('includes twitter card', () => {
    const meta = buildPageMeta({ title: 'T', description: 'D', canonical: '/t' });
    const tw = meta.twitter as { card: string };
    expect(tw.card).toBe('summary');
  });
});

describe('buildBreadcrumbJsonLd', () => {
  it('generates valid BreadcrumbList with correct positions', () => {
    const result = buildBreadcrumbJsonLd([
      { name: 'AMONG',   url: '/' },
      { name: 'Explore', url: '/explore' },
      { name: 'Grief',   url: '/explore/grief' },
    ]);
    const ld = result as {
      '@type': string;
      itemListElement: Array<{ '@type': string; position: number; name: string }>;
    };
    expect(ld['@type']).toBe('BreadcrumbList');
    expect(ld.itemListElement).toHaveLength(3);
    expect(ld.itemListElement[0].position).toBe(1);
    expect(ld.itemListElement[1].position).toBe(2);
    expect(ld.itemListElement[2].position).toBe(3);
    expect(ld.itemListElement[2].name).toBe('Grief');
  });

  it('prepends siteUrl to relative paths', () => {
    const result = buildBreadcrumbJsonLd([{ name: 'Page', url: '/page' }]) as {
      itemListElement: Array<{ item: string }>;
    };
    expect(result.itemListElement[0].item).toContain('/page');
  });

  it('preserves absolute URLs without doubling', () => {
    const result = buildBreadcrumbJsonLd([
      { name: 'AMONG', url: 'https://among.io' },
    ]) as { itemListElement: Array<{ item: string }> };
    expect(result.itemListElement[0].item).toBe('https://among.io');
  });
});

describe('buildOrganizationJsonLd', () => {
  it('has required schema.org fields', () => {
    const result = buildOrganizationJsonLd() as {
      '@context': string;
      '@type':    string;
      name:       string;
      url:        string;
    };
    expect(result['@context']).toBe('https://schema.org');
    expect(result['@type']).toBe('Organization');
    expect(result.name).toBe('AMONG');
    expect(result.url).toContain('among.io');
  });
});

describe('buildWebSiteJsonLd', () => {
  it('has required schema.org fields', () => {
    const result = buildWebSiteJsonLd() as {
      '@context': string;
      '@type':    string;
      name:       string;
      url:        string;
    };
    expect(result['@context']).toBe('https://schema.org');
    expect(result['@type']).toBe('WebSite');
    expect(result.name).toBe('AMONG');
    expect(result.url).toContain('among.io');
  });
});

describe('buildFaqPageJsonLd', () => {
  it('maps questions into a FAQPage entity list', () => {
    const result = buildFaqPageJsonLd([
      { question: 'What is AMONG?', answer: 'An anonymous experience network.' },
    ]) as {
      '@type': string;
      mainEntity: Array<{
        '@type': string;
        name: string;
        acceptedAnswer: { '@type': string; text: string };
      }>;
    };
    expect(result['@type']).toBe('FAQPage');
    expect(result.mainEntity).toHaveLength(1);
    expect(result.mainEntity[0]?.['@type']).toBe('Question');
    expect(result.mainEntity[0]?.name).toBe('What is AMONG?');
    expect(result.mainEntity[0]?.acceptedAnswer.text).toBe('An anonymous experience network.');
  });
});
