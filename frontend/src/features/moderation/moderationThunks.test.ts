/**
 * moderationThunks.test.ts — Unit tests for moderation Redux thunks.
 */
import * as api from '../../lib/moderationApi';
import { submitReportThunk, blockUserThunk, unblockUserThunk } from './moderationThunks';
import {
  reportLoading,
  reportSubmitted,
  reportError,
  blockSucceeded,
  unblockSucceeded,
  blockListError,
} from './moderationSlice';

jest.mock('../../lib/moderationApi');

const mockSubmitReport = api.submitReport as jest.Mock;
const mockBlockUser    = api.blockUser    as jest.Mock;
const mockUnblockUser  = api.unblockUser  as jest.Mock;

function makeDispatch() {
  const actions: unknown[] = [];
  const dispatch = (action: unknown) => {
    actions.push(action);
    return action;
  };
  return { dispatch, actions };
}

beforeEach(() => jest.resetAllMocks());

// ─── submitReportThunk ────────────────────────────────────────────────────────

describe('submitReportThunk', () => {
  it('dispatches reportLoading then reportSubmitted on success', async () => {
    mockSubmitReport.mockResolvedValueOnce({ success: true });
    const { dispatch, actions } = makeDispatch();
    await submitReportThunk({
      contentType: 'post',
      contentId:   'post-1',
      reason:      'harassment',
    })(dispatch as any);
    expect(actions[0]).toMatchObject(reportLoading());
    expect(actions[1]).toMatchObject(reportSubmitted());
  });

  it('dispatches reportLoading then reportError on failure', async () => {
    mockSubmitReport.mockRejectedValueOnce(new Error('Network error'));
    const { dispatch, actions } = makeDispatch();
    await submitReportThunk({
      contentType: 'post',
      contentId:   'post-1',
      reason:      'spam',
    })(dispatch as any);
    expect(actions[0]).toMatchObject(reportLoading());
    expect((actions[1] as { type: string }).type).toBe(reportError.type);
  });

  it('report confirmation is neutral — never reveals outcome', async () => {
    mockSubmitReport.mockResolvedValueOnce({ success: true });
    const { dispatch, actions } = makeDispatch();
    await submitReportThunk({
      contentType: 'post',
      contentId:   'post-1',
      reason:      'harassment',
    })(dispatch as any);
    // reportSubmitted action has no outcome payload (just sets submitted = true)
    expect(actions[1]).toEqual(reportSubmitted());
  });
});

// ─── blockUserThunk ───────────────────────────────────────────────────────────

describe('blockUserThunk', () => {
  it('dispatches blockSucceeded on success', async () => {
    mockBlockUser.mockResolvedValueOnce({ success: true });
    const { dispatch, actions } = makeDispatch();
    await blockUserThunk('acc-5')(dispatch as any);
    expect(actions[0]).toMatchObject(blockSucceeded('acc-5'));
  });

  it('dispatches blockListError on failure', async () => {
    mockBlockUser.mockRejectedValueOnce(new Error('fail'));
    const { dispatch, actions } = makeDispatch();
    await blockUserThunk('acc-5')(dispatch as any);
    expect((actions[0] as { type: string }).type).toBe(blockListError.type);
  });
});

// ─── unblockUserThunk ─────────────────────────────────────────────────────────

describe('unblockUserThunk', () => {
  it('dispatches unblockSucceeded on success', async () => {
    mockUnblockUser.mockResolvedValueOnce({ success: true });
    const { dispatch, actions } = makeDispatch();
    await unblockUserThunk('acc-5')(dispatch as any);
    expect(actions[0]).toMatchObject(unblockSucceeded('acc-5'));
  });

  it('dispatches blockListError on failure', async () => {
    mockUnblockUser.mockRejectedValueOnce(new Error('fail'));
    const { dispatch, actions } = makeDispatch();
    await unblockUserThunk('acc-5')(dispatch as any);
    expect((actions[0] as { type: string }).type).toBe(blockListError.type);
  });
});
