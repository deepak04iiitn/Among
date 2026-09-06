/**
 * useFeatureFlag.ts — React hook for reading a feature flag from the Redux store.
 *
 * Usage:
 *   const isSNYEnabled = useFeatureFlag('someoneNeedsYou');
 *
 * Returns false by default (safe-off) until flags have been loaded from server.
 */
import { useSelector } from 'react-redux';
import { selectFlag } from '../features/featureFlags/featureFlagsSlice';
import type { FeatureFlag } from '../constants/featureFlags';

export function useFeatureFlag(flag: FeatureFlag): boolean {
  return useSelector(selectFlag(flag));
}
