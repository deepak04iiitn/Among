import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Someone Needs You',
  robots: { index: false, follow: false },
};

export default function SomeoneNeedsYouPage() {
  return (
    <div className="content-column py-10">
      <h1 className="sr-only">Someone Needs You</h1>
      <p className="font-editorial text-title text-[var(--color-text-muted)]">
        Someone Needs You — coming in a later phase.
      </p>
    </div>
  );
}
