/**
 * snyThunks.test.ts — Unit tests for SNY thunks.
 */
import { configureStore } from '@reduxjs/toolkit';
import snyReducer from './snySlice';
import * as snyApi from '../../lib/snyApi';
import {
  fetchDailyPromptThunk,
  skipPromptThunk,
  acceptPromptThunk,
  dismissPromptThunk,
  fetchExperienceHistoryThunk,
  updateOptInThunk,
} from './snyThunks';

jest.mock('../../lib/snyApi');

const mockGetDailyPrompt     = snyApi.getDailyPrompt     as jest.Mock;
const mockSkipPrompt         = snyApi.skipPrompt         as jest.Mock;
const mockAcceptPrompt       = snyApi.acceptPrompt       as jest.Mock;
const mockDismissPrompt      = snyApi.dismissPrompt      as jest.Mock;
const mockGetExperienceHistory = snyApi.getExperienceHistory as jest.Mock;
const mockUpdateOptIn        = snyApi.updateOptIn        as jest.Mock;

const SAMPLE_PROMPT = {
  postId: 'post-1', categoryId: 'anxiety',
  bodyPreview: 'I feel so alone.', skipsUsed: 0, skipsRemaining: 3,
};

function makeStore() {
  return configureStore({ reducer: { sny: snyReducer } });
}

beforeEach(() => jest.resetAllMocks());

// ─── fetchDailyPromptThunk ────────────────────────────────────────────────────

describe('fetchDailyPromptThunk', () => {
  it('dispatches promptLoaded on success', async () => {
    mockGetDailyPrompt.mockResolvedValueOnce(SAMPLE_PROMPT);
    const store = makeStore();
    await store.dispatch(fetchDailyPromptThunk() as any);
    expect(store.getState().sny.prompt?.postId).toBe('post-1');
    expect(store.getState().sny.status).toBe('success');
  });

  it('dispatches snyError on failure', async () => {
    mockGetDailyPrompt.mockRejectedValueOnce(new Error('Network error'));
    const store = makeStore();
    await store.dispatch(fetchDailyPromptThunk() as any);
    expect(store.getState().sny.status).toBe('error');
    expect(store.getState().sny.error).toBe('Network error');
  });

  it('dispatches promptLoaded with null when no prompt', async () => {
    mockGetDailyPrompt.mockResolvedValueOnce(null);
    const store = makeStore();
    await store.dispatch(fetchDailyPromptThunk() as any);
    expect(store.getState().sny.prompt).toBeNull();
    expect(store.getState().sny.status).toBe('success');
  });
});

// ─── skipPromptThunk ──────────────────────────────────────────────────────────

describe('skipPromptThunk', () => {
  it('dispatches promptSkipped with next prompt', async () => {
    const next = { ...SAMPLE_PROMPT, postId: 'post-2', skipsUsed: 1 };
    mockSkipPrompt.mockResolvedValueOnce(next);
    const store = makeStore();
    await store.dispatch(skipPromptThunk('post-1') as any);
    expect(store.getState().sny.prompt?.postId).toBe('post-2');
  });

  it('dispatches promptSkipped with null when limit reached', async () => {
    mockSkipPrompt.mockResolvedValueOnce(null);
    const store = makeStore();
    await store.dispatch(skipPromptThunk('post-1') as any);
    expect(store.getState().sny.prompt).toBeNull();
  });

  it('dispatches snyError on API failure', async () => {
    mockSkipPrompt.mockRejectedValueOnce(new Error('skip failed'));
    const store = makeStore();
    await store.dispatch(skipPromptThunk('post-1') as any);
    expect(store.getState().sny.status).toBe('error');
  });
});

// ─── acceptPromptThunk ────────────────────────────────────────────────────────

describe('acceptPromptThunk', () => {
  it('dispatches promptAccepted with context', async () => {
    mockAcceptPrompt.mockResolvedValueOnce({ contextCategoryId: 'anxiety', contextPostId: 'post-1' });
    const store = makeStore();
    await store.dispatch(acceptPromptThunk('post-1') as any);
    expect(store.getState().sny.acceptedContext?.contextCategoryId).toBe('anxiety');
    expect(store.getState().sny.prompt).toBeNull();
  });
});

// ─── dismissPromptThunk ───────────────────────────────────────────────────────

describe('dismissPromptThunk', () => {
  it('dispatches promptDismissed on success', async () => {
    mockDismissPrompt.mockResolvedValueOnce(undefined);
    const store = makeStore();
    // Set up some state first
    store.dispatch({ type: 'sny/promptLoaded', payload: SAMPLE_PROMPT } as any);
    await store.dispatch(dismissPromptThunk() as any);
    expect(store.getState().sny.prompt).toBeNull();
  });
});

// ─── fetchExperienceHistoryThunk ──────────────────────────────────────────────

describe('fetchExperienceHistoryThunk', () => {
  it('dispatches historyLoaded on success', async () => {
    mockGetExperienceHistory.mockResolvedValueOnce([
      { categoryId: 'grief', hasPostedAbout: false, pastReactionCount: 1, conversationCount: 0, snyOptIn: true, lastUpdatedAt: '' },
    ]);
    const store = makeStore();
    await store.dispatch(fetchExperienceHistoryThunk() as any);
    expect(store.getState().sny.experienceHistory).toHaveLength(1);
  });
});

// ─── updateOptInThunk ─────────────────────────────────────────────────────────

describe('updateOptInThunk', () => {
  const history = [
    { categoryId: 'grief', hasPostedAbout: false, pastReactionCount: 1, conversationCount: 0, snyOptIn: false, lastUpdatedAt: '' },
  ];

  it('optimistically updates opt-in and persists on success', async () => {
    mockUpdateOptIn.mockResolvedValueOnce(undefined);
    const store = makeStore();
    store.dispatch({ type: 'sny/historyLoaded', payload: history } as any);

    await store.dispatch(updateOptInThunk('grief', true) as any);

    expect(store.getState().sny.experienceHistory.find((e) => e.categoryId === 'grief')?.snyOptIn).toBe(true);
  });

  it('reverts opt-in on API failure', async () => {
    mockUpdateOptIn.mockRejectedValueOnce(new Error('API error'));
    const store = makeStore();
    store.dispatch({ type: 'sny/historyLoaded', payload: history } as any);

    await store.dispatch(updateOptInThunk('grief', true) as any);

    // Reverted
    expect(store.getState().sny.experienceHistory.find((e) => e.categoryId === 'grief')?.snyOptIn).toBe(false);
    expect(store.getState().sny.status).toBe('error');
  });
});
