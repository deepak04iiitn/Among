/**
 * snySlice.test.ts — Unit tests for the SNY Redux slice.
 */
import { configureStore } from '@reduxjs/toolkit';
import snyReducer, {
  snyLoading,
  promptLoaded,
  promptStatusLoaded,
  promptSkipped,
  promptAccepted,
  promptDismissed,
  historyLoaded,
  optInUpdated,
  snyError,
  acceptedContextCleared,
  selectSNYPrompt,
  selectSNYStatus,
  selectSNYError,
  selectPromptStatus,
  selectExperienceHistory,
  selectAcceptedContext,
} from './snySlice';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SAMPLE_PROMPT = {
  postId:        'post-1',
  categoryId:    'anxiety',
  bodyPreview:   'I feel so alone.',
  skipsUsed:     0,
  skipsRemaining: 3,
};

function makeStore() {
  return configureStore({ reducer: { sny: snyReducer } });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('snySlice — initial state', () => {
  it('has correct initial state', () => {
    const store = makeStore();
    const state = store.getState().sny;
    expect(state.prompt).toBeNull();
    expect(state.status).toBe('idle');
    expect(state.error).toBeNull();
    expect(state.experienceHistory).toEqual([]);
    expect(state.acceptedContext).toBeNull();
  });
});

describe('snyLoading', () => {
  it('sets status to loading and clears error', () => {
    const store = makeStore();
    store.dispatch(snyError('previous error'));
    store.dispatch(snyLoading());
    const state = store.getState().sny;
    expect(state.status).toBe('loading');
    expect(state.error).toBeNull();
  });
});

describe('promptLoaded', () => {
  it('sets the prompt and status to success', () => {
    const store = makeStore();
    store.dispatch(promptLoaded(SAMPLE_PROMPT));
    const state = store.getState().sny;
    expect(state.prompt?.postId).toBe('post-1');
    expect(state.status).toBe('success');
  });

  it('sets prompt to null when null is dispatched', () => {
    const store = makeStore();
    store.dispatch(promptLoaded(null));
    expect(store.getState().sny.prompt).toBeNull();
  });
});

describe('promptStatusLoaded', () => {
  it('sets the prompt status', () => {
    const store = makeStore();
    store.dispatch(promptStatusLoaded({ dismissed: false, promptsSent: 0, skipsUsed: 1 }));
    expect(store.getState().sny.promptStatus?.skipsUsed).toBe(1);
  });
});

describe('promptSkipped', () => {
  it('updates the prompt with the next one and increments skipsUsed', () => {
    const store = makeStore();
    store.dispatch(promptStatusLoaded({ dismissed: false, promptsSent: 0, skipsUsed: 0 }));
    store.dispatch(promptLoaded(SAMPLE_PROMPT));

    const nextPrompt = { ...SAMPLE_PROMPT, postId: 'post-2', skipsUsed: 1, skipsRemaining: 2 };
    store.dispatch(promptSkipped(nextPrompt));

    const state = store.getState().sny;
    expect(state.prompt?.postId).toBe('post-2');
    expect(state.promptStatus?.skipsUsed).toBe(1);
  });

  it('sets prompt to null when no next prompt', () => {
    const store = makeStore();
    store.dispatch(promptSkipped(null));
    expect(store.getState().sny.prompt).toBeNull();
  });
});

describe('promptAccepted', () => {
  it('clears the prompt and sets acceptedContext', () => {
    const store = makeStore();
    store.dispatch(promptLoaded(SAMPLE_PROMPT));
    store.dispatch(promptAccepted({ contextCategoryId: 'anxiety', contextPostId: 'post-1' }));

    const state = store.getState().sny;
    expect(state.prompt).toBeNull();
    expect(state.acceptedContext?.contextCategoryId).toBe('anxiety');
    expect(state.acceptedContext?.contextPostId).toBe('post-1');
    expect(state.status).toBe('success');
  });
});

describe('promptDismissed', () => {
  it('clears prompt and marks promptStatus as dismissed', () => {
    const store = makeStore();
    store.dispatch(promptLoaded(SAMPLE_PROMPT));
    store.dispatch(promptStatusLoaded({ dismissed: false, promptsSent: 0, skipsUsed: 0 }));
    store.dispatch(promptDismissed());

    const state = store.getState().sny;
    expect(state.prompt).toBeNull();
    expect(state.promptStatus?.dismissed).toBe(true);
  });
});

describe('historyLoaded', () => {
  it('sets experience history', () => {
    const store = makeStore();
    store.dispatch(historyLoaded([
      { categoryId: 'grief', hasPostedAbout: false, pastReactionCount: 2, conversationCount: 1, snyOptIn: true, lastUpdatedAt: '2025-01-01' },
    ]));
    expect(store.getState().sny.experienceHistory).toHaveLength(1);
    expect(store.getState().sny.experienceHistory[0]?.categoryId).toBe('grief');
  });
});

describe('optInUpdated', () => {
  it('updates the snyOptIn for the specified category', () => {
    const store = makeStore();
    store.dispatch(historyLoaded([
      { categoryId: 'grief', hasPostedAbout: false, pastReactionCount: 2, conversationCount: 1, snyOptIn: true, lastUpdatedAt: '' },
      { categoryId: 'work', hasPostedAbout: false, pastReactionCount: 1, conversationCount: 0, snyOptIn: false, lastUpdatedAt: '' },
    ]));
    store.dispatch(optInUpdated({ categoryId: 'work', optIn: true }));

    const state = store.getState().sny;
    expect(state.experienceHistory.find((e) => e.categoryId === 'work')?.snyOptIn).toBe(true);
    // Other categories unchanged
    expect(state.experienceHistory.find((e) => e.categoryId === 'grief')?.snyOptIn).toBe(true);
  });
});

describe('snyError', () => {
  it('sets status to error with message', () => {
    const store = makeStore();
    store.dispatch(snyError('Something went wrong'));
    const state = store.getState().sny;
    expect(state.status).toBe('error');
    expect(state.error).toBe('Something went wrong');
  });
});

describe('acceptedContextCleared', () => {
  it('clears the acceptedContext', () => {
    const store = makeStore();
    store.dispatch(promptAccepted({ contextCategoryId: 'anxiety', contextPostId: 'post-1' }));
    store.dispatch(acceptedContextCleared());
    expect(store.getState().sny.acceptedContext).toBeNull();
  });
});

// ─── Selectors ────────────────────────────────────────────────────────────────

describe('selectors', () => {
  it('selectSNYPrompt returns prompt', () => {
    const store = makeStore();
    store.dispatch(promptLoaded(SAMPLE_PROMPT));
    expect(selectSNYPrompt(store.getState() as any)).toEqual(SAMPLE_PROMPT);
  });

  it('selectSNYStatus returns status', () => {
    const store = makeStore();
    store.dispatch(snyLoading());
    expect(selectSNYStatus(store.getState() as any)).toBe('loading');
  });

  it('selectSNYError returns error', () => {
    const store = makeStore();
    store.dispatch(snyError('oops'));
    expect(selectSNYError(store.getState() as any)).toBe('oops');
  });

  it('selectPromptStatus returns promptStatus', () => {
    const store = makeStore();
    store.dispatch(promptStatusLoaded({ dismissed: true, promptsSent: 1, skipsUsed: 2 }));
    expect(selectPromptStatus(store.getState() as any)?.dismissed).toBe(true);
  });

  it('selectExperienceHistory returns history', () => {
    const store = makeStore();
    store.dispatch(historyLoaded([
      { categoryId: 'grief', hasPostedAbout: false, pastReactionCount: 1, conversationCount: 0, snyOptIn: false, lastUpdatedAt: '' },
    ]));
    expect(selectExperienceHistory(store.getState() as any)).toHaveLength(1);
  });

  it('selectAcceptedContext returns acceptedContext', () => {
    const store = makeStore();
    store.dispatch(promptAccepted({ contextCategoryId: 'work', contextPostId: 'p' }));
    expect(selectAcceptedContext(store.getState() as any)?.contextCategoryId).toBe('work');
  });
});
