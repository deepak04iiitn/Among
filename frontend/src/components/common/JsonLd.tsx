/**
 * JsonLd.tsx — Reusable JSON-LD structured data injector.
 *
 * Server component — renders a <script type="application/ld+json"> tag
 * directly in the HTML. Safe: no PII is ever included.
 *
 * Usage:
 *   <JsonLd data={buildOrganizationJsonLd()} />
 */

interface JsonLdProps {
  readonly data: object;
  /** Optional id to disambiguate multiple JSON-LD blocks on one page */
  readonly id?: string;
}

export default function JsonLd({ data, id }: JsonLdProps) {
  return (
    <script
      id={id}
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: safe — no user content, structured data only
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
