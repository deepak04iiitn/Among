import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BreadcrumbSegment {
  /** Display label */
  label: string;
  /** URL path — omit for the last (current) segment */
  href?: string;
}

interface BreadcrumbProps {
  segments: BreadcrumbSegment[];
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Breadcrumb navigation component.
 *
 * Renders both:
 * 1. Visible breadcrumb trail for users.
 * 2. JSON-LD BreadcrumbList structured data for search engines (FR-SEO-18).
 *
 * The last segment is always the current page — not a link.
 * Uses `aria-label="Breadcrumb"` on <nav> and `aria-current="page"` on the last item.
 */
export default function Breadcrumb({ segments, className = '' }: BreadcrumbProps) {
  if (segments.length < 2) return null;

  // ── JSON-LD BreadcrumbList ──────────────────────────────────────────────────
  const siteUrl = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://among.io';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: segments.map((seg, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: seg.label,
      ...(seg.href ? { item: `${siteUrl}${seg.href}` } : {}),
    })),
  };

  return (
    <>
      {/* Structured data — hidden from UI */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Visible breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className={`flex items-center gap-1 ${className}`}
      >
        <ol className="flex items-center gap-1 flex-wrap">
          {segments.map((seg, idx) => {
            const isLast = idx === segments.length - 1;
            return (
              <li key={`${seg.label}-${idx}`} className="flex items-center gap-1">
                {idx > 0 && (
                  <ChevronRight
                    size={12}
                    strokeWidth={1.5}
                    className="text-[var(--color-text-muted)]"
                    aria-hidden="true"
                  />
                )}
                {isLast || !seg.href ? (
                  <span
                    aria-current={isLast ? 'page' : undefined}
                    className="text-caption text-[var(--color-text-muted)]"
                  >
                    {seg.label}
                  </span>
                ) : (
                  <Link
                    href={seg.href}
                    className="text-caption text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                  >
                    {seg.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
