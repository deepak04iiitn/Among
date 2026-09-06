/**
 * moderationSlice.test.ts — Unit tests for the moderation Redux slice.
 */
import moderationReducer, {
  openReportModal,
  closeReportModal,
  reportLoading,
  reportSubmitted,
  reportError,
  blockListLoading,
  blockListLoaded,
  blockListError,
  openBlockConfirm,
  closeBlockConfirm,
  blockSucceeded,
  unblockSucceeded,
  type ModerationState,
} from './moderationSlice';

const initial: ModerationState = {
  reportModalOpen:    false,
  reportTarget:       null,
  reportSubmitted:    false,
  reportLoading:      false,
  blockList:          [],
  blockListStatus:    'idle',
  blockConfirmTarget: null,
  error:              null,
};

describe('moderationSlice', () => {
  it('has correct initial state', () => {
    expect(moderationReducer(undefined, { type: '@@INIT' })).toEqual(initial);
  });

  // ─── Report modal ──────────────────────────────────────────────────────────

  it('openReportModal sets modal open and target', () => {
    const state = moderationReducer(initial, openReportModal({
      contentId: 'post-1', contentType: 'post',
    }));
    expect(state.reportModalOpen).toBe(true);
    expect(state.reportTarget).toEqual({ contentId: 'post-1', contentType: 'post' });
    expect(state.reportSubmitted).toBe(false);
  });

  it('closeReportModal clears state', () => {
    const open = moderationReducer(initial, openReportModal({ contentId: 'x', contentType: 'post' }));
    const state = moderationReducer(open, closeReportModal());
    expect(state.reportModalOpen).toBe(false);
    expect(state.reportTarget).toBeNull();
  });

  it('reportLoading sets loading flag', () => {
    const state = moderationReducer(initial, reportLoading());
    expect(state.reportLoading).toBe(true);
  });

  it('reportSubmitted sets submitted and clears loading', () => {
    const loading = moderationReducer(initial, reportLoading());
    const state   = moderationReducer(loading, reportSubmitted());
    expect(state.reportLoading).toBe(false);
    expect(state.reportSubmitted).toBe(true);
  });

  it('reportError clears loading and sets error', () => {
    const state = moderationReducer(initial, reportError('oops'));
    expect(state.reportLoading).toBe(false);
    expect(state.error).toBe('oops');
  });

  // ─── Block list ────────────────────────────────────────────────────────────

  it('blockListLoading sets status to loading', () => {
    const state = moderationReducer(initial, blockListLoading());
    expect(state.blockListStatus).toBe('loading');
  });

  it('blockListLoaded populates blockList', () => {
    const blocks = [{ blockedAccountId: 'acc-2', createdAt: '2026-01-01T00:00:00Z' }];
    const state  = moderationReducer(initial, blockListLoaded(blocks));
    expect(state.blockListStatus).toBe('success');
    expect(state.blockList).toEqual(blocks);
  });

  it('blockListError sets error status', () => {
    const state = moderationReducer(initial, blockListError('fail'));
    expect(state.blockListStatus).toBe('error');
    expect(state.error).toBe('fail');
  });

  // ─── Block confirm ─────────────────────────────────────────────────────────

  it('openBlockConfirm sets target', () => {
    const state = moderationReducer(initial, openBlockConfirm('acc-5'));
    expect(state.blockConfirmTarget).toBe('acc-5');
  });

  it('closeBlockConfirm clears target', () => {
    const s1 = moderationReducer(initial, openBlockConfirm('acc-5'));
    const s2 = moderationReducer(s1, closeBlockConfirm());
    expect(s2.blockConfirmTarget).toBeNull();
  });

  it('blockSucceeded clears target', () => {
    const s1    = moderationReducer(initial, openBlockConfirm('acc-5'));
    const state = moderationReducer(s1, blockSucceeded('acc-5'));
    expect(state.blockConfirmTarget).toBeNull();
  });

  it('unblockSucceeded removes entry from blockList', () => {
    const loaded = moderationReducer(initial, blockListLoaded([
      { blockedAccountId: 'acc-2', createdAt: '2026-01-01T00:00:00Z' },
      { blockedAccountId: 'acc-3', createdAt: '2026-01-02T00:00:00Z' },
    ]));
    const state = moderationReducer(loaded, unblockSucceeded('acc-2'));
    expect(state.blockList.find((b) => b.blockedAccountId === 'acc-2')).toBeUndefined();
    expect(state.blockList).toHaveLength(1);
  });
});
