import type { Metadata } from 'next';
import Link from 'next/link';
import { ROUTES } from '../constants/routes';

export const metadata: Metadata = {
  title: 'Not Found',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center text-center px-6">
      <p className="text-caption text-text-muted uppercase tracking-[0.15em] mb-4">404</p>
      <h1 className="text-headline font-editorial font-normal mb-4">
        This page is not here
      </h1>
      <p className="text-body text-text-secondary mb-8 max-w-md">
        The experience you are looking for may have been removed or the link may be incorrect.
      </p>
      <Link
        href={ROUTES.LANDING}
        className="px-6 py-2.5 border border-border rounded-md text-ui hover:border-border-strong transition-colors"
      >
        Back to AMONG
      </Link>
    </main>
  );
}
