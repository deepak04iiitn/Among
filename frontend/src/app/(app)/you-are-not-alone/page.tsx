/**
 * You Are Not Alone — privacy-thresholded stats plus account actions.
 */
'use client';

import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '../../../store';
import { fetchYanaStatsThunk } from '../../../features/discovery/discoveryThunks';
import { signOutThunk } from '../../../features/auth/authThunks';
import {
  selectYanaStats,
  selectYanaLoading,
} from '../../../features/discovery/discoverySlice';
import { selectAliasName } from '../../../features/identity/identitySlice';
import { YouAreNotAlone } from '../../../components/discovery/YouAreNotAlone';
import { ROUTES } from '../../../constants/routes';

export default function YouAreNotAlonePage(): JSX.Element {
  const dispatch   = useAppDispatch();
  const router     = useRouter();
  const entries    = useAppSelector(selectYanaStats);
  const loading    = useAppSelector(selectYanaLoading);
  const aliasName  = useAppSelector(selectAliasName);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    void dispatch(fetchYanaStatsThunk()).finally(() => setBooting(false));
  }, [dispatch]);

  async function handleSignOut(): Promise<void> {
    await dispatch(signOutThunk());
    router.push(ROUTES.LANDING);
  }

  return (
    <div className="content-column py-10">
      <h1 className="sr-only">You Are Not Alone</h1>

      {aliasName && (
        <p className="text-caption text-[var(--color-text-muted)] uppercase tracking-widest mb-8">
          {aliasName}
        </p>
      )}

      <YouAreNotAlone entries={entries} loading={loading || booting} />

      <nav
        aria-label="Your account"
        className="mt-16 pt-10 border-t border-[var(--color-border)] space-y-4"
      >
        <Link
          href={ROUTES.SAVED}
          className="flex items-center text-body text-[var(--color-text)] hover:opacity-70 transition-opacity min-h-[44px]"
        >
          Saved experiences
        </Link>
        <Link
          href={ROUTES.SETTINGS}
          className="flex items-center text-body text-[var(--color-text)] hover:opacity-70 transition-opacity min-h-[44px]"
        >
          Settings
        </Link>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="block text-body text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors min-h-[44px] text-left"
          aria-label="Log out of AMONG"
        >
          Log out
        </button>
      </nav>
    </div>
  );
}
