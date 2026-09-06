import type { Metadata } from 'next';
import Link from 'next/link';
import AppShell from '../../components/layout/AppShell';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { ROUTES } from '../../constants/routes';

export const metadata: Metadata = {
  title: 'Community guidelines — AMONG',
  description:
    'AMONG community guidelines. How we keep this space safe, anonymous, and genuinely human.',
  alternates: { canonical: '/guidelines' },
};

export default function GuidelinesPage() {
  return (
    <AppShell>
      <div className="content-column py-10">
        <Breadcrumb
          segments={[{ label: 'AMONG', href: ROUTES.LANDING }, { label: 'Guidelines' }]}
          className="mb-6"
        />

        <h1 className="font-editorial text-title-xl text-[var(--color-text)] text-balance">
          Community guidelines
        </h1>

        <div className="mt-6 space-y-8 max-w-reading">
          <section>
            <h2 className="font-editorial text-title text-[var(--color-text)]">Be honest</h2>
            <p className="mt-2 text-body text-[var(--color-text-secondary)]">
              Share your real experiences. AMONG is not a place for fictional stories or
              content designed to go viral. It is a place for things that actually happened to you.
            </p>
          </section>

          <section>
            <h2 className="font-editorial text-title text-[var(--color-text)]">Be kind</h2>
            <p className="mt-2 text-body text-[var(--color-text-secondary)]">
              Others are here because they are going through something. Respond with the care
              you would want someone to show you.
            </p>
          </section>

          <section>
            <h2 className="font-editorial text-title text-[var(--color-text)]">Stay anonymous</h2>
            <p className="mt-2 text-body text-[var(--color-text-secondary)]">
              Do not include names — yours or others'. Do not include contact details,
              locations, or anything that could identify a person. Anonymity is what makes
              this place safe.
            </p>
          </section>

          <section>
            <h2 className="font-editorial text-title text-[var(--color-text)]">No harm</h2>
            <p className="mt-2 text-body text-[var(--color-text-secondary)]">
              Content that encourages harm to self or others will be removed immediately.
              If you or someone you know is in crisis, please reach out to a crisis service.
            </p>
          </section>
        </div>

        {/* Internal links — FR-SEO-14 */}
        <div className="mt-12 pt-8 border-t border-[var(--color-border)] flex flex-wrap gap-4">
          <Link href={ROUTES.ABOUT}   className="text-ui text-[var(--color-accent)] hover:opacity-80">About AMONG →</Link>
          <Link href={ROUTES.HELP}    className="text-ui text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">Help</Link>
          <Link href={ROUTES.EXPLORE} className="text-ui text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">Explore experiences</Link>
        </div>
      </div>
    </AppShell>
  );
}
