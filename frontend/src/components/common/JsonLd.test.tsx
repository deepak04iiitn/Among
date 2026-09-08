/**
 * JsonLd.test.tsx — Tests for JSON-LD structured data injection.
 *
 * Invariants:
 *  - Renders a script tag with type="application/ld+json".
 *  - JSON content matches the data prop.
 *  - Optional id is applied to the script tag.
 */
import { render } from '@testing-library/react';
import JsonLd from './JsonLd';

describe('JsonLd', () => {
  it('renders a script tag with correct type', () => {
    const { container } = render(
      <JsonLd data={{ '@type': 'Organization', name: 'AMONG' }} />
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
  });

  it('contains the serialized data', () => {
    const data = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'AMONG' };
    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script!.innerHTML);
    expect(parsed.name).toBe('AMONG');
    expect(parsed['@type']).toBe('WebSite');
  });

  it('applies optional id to the script tag', () => {
    const { container } = render(<JsonLd data={{ '@type': 'Organization' }} id="ld-org" />);
    const script = container.querySelector('script#ld-org');
    expect(script).not.toBeNull();
  });
});
