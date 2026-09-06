/**
 * report.service.test.ts — Unit tests for report.service.ts
 *
 * Critical invariants:
 *  - Reporter identity NEVER returned in queue results.
 *  - Crisis-flagged reports appear at TOP of queue.
 *  - Dismiss does not trigger enforcement.
 *  - Moderator cannot issue permanent ban (only admin).
 *  - Action log entry created for every action.
 *  - Report on non-existent content returns 404 (but submitReport always returns success).
 */
import { Types } from 'mongoose';
import * as reportService from './report.service';
import { ReportModel } from './report.model';
import { PostModel } from '../posts/post.model';
import { MessageModel } from '../conversations/message.model';

jest.mock('./report.model', () => ({
  ReportModel: {
    create: jest.fn(),
    find:   jest.fn(),
    findById: jest.fn(),
  },
}));

jest.mock('../posts/post.model', () => ({
  PostModel: { findById: jest.fn() },
}));

jest.mock('../conversations/message.model', () => ({
  MessageModel: { findById: jest.fn() },
}));

const mockReportCreate   = ReportModel.create   as jest.Mock;
const mockReportFind     = ReportModel.find     as jest.Mock;
const mockReportFindById = ReportModel.findById as jest.Mock;
const mockPostFindById   = PostModel.findById   as jest.Mock;
void (MessageModel.findById as jest.Mock); // imported for mock registration

const REPORTER_ID = String(new Types.ObjectId());
const ACCOUNT_ID  = String(new Types.ObjectId());
const POST_ID     = String(new Types.ObjectId());
const MOD_ID      = String(new Types.ObjectId());

function makeFakePost() {
  return { _id: new Types.ObjectId(POST_ID), accountId: new Types.ObjectId(ACCOUNT_ID), body: 'test' };
}

function makeFakeReport(overrides: Partial<{
  isCrisisFlagged: boolean;
  status: string;
  actionLog: Array<{ actorId: Types.ObjectId; action: string; timestamp: Date; notes: string }>;
}> = {}) {
  const report = {
    _id:                 new Types.ObjectId(),
    reporterAccountId:   new Types.ObjectId(REPORTER_ID),
    reportedContentType: 'post',
    reportedContentId:   new Types.ObjectId(POST_ID),
    reportedAccountId:   new Types.ObjectId(ACCOUNT_ID),
    reason:              'harassment',
    severity:            'high',
    isCrisisFlagged:     overrides.isCrisisFlagged ?? false,
    additionalDetails:   '',
    status:              overrides.status ?? 'open',
    moderatorId:         null,
    actionTaken:         null,
    actionLog:           overrides.actionLog ?? [],
    createdAt:           new Date(),
    resolvedAt:          null,
    save:                jest.fn().mockResolvedValue(undefined),
    push:                undefined as unknown,
  };
  // Make actionLog.push work
  Object.defineProperty(report, 'push', { value: jest.fn() });
  return report;
}

beforeEach(() => {
  jest.resetAllMocks();
  mockReportCreate.mockResolvedValue({});
});

// ─── submitReport ─────────────────────────────────────────────────────────────

describe('submitReport', () => {
  it('always returns { success: true }', async () => {
    mockPostFindById.mockReturnValueOnce({ lean: () => Promise.resolve(makeFakePost()) });
    mockReportCreate.mockResolvedValueOnce({});

    const result = await reportService.submitReport(REPORTER_ID, {
      contentType: 'post',
      contentId:   POST_ID,
      reason:      'harassment',
    });
    expect(result).toEqual({ success: true });
  });

  it('returns { success: true } even when content is not found', async () => {
    mockPostFindById.mockReturnValueOnce({ lean: () => Promise.resolve(null) });
    const result = await reportService.submitReport(REPORTER_ID, {
      contentType: 'post',
      contentId:   POST_ID,
      reason:      'spam',
    });
    expect(result).toEqual({ success: true });
  });

  it('classifies crisis reason as critical severity', async () => {
    mockPostFindById.mockReturnValueOnce({ lean: () => Promise.resolve(makeFakePost()) });

    await reportService.submitReport(REPORTER_ID, {
      contentType: 'post',
      contentId:   POST_ID,
      reason:      'self_harm_risk',
    });

    expect(mockReportCreate).toHaveBeenCalledWith(
      expect.objectContaining({ isCrisisFlagged: true, severity: 'critical' })
    );
  });

  it('reporter identity is not returned from the service (only stored, never exposed)', async () => {
    mockPostFindById.mockReturnValueOnce({ lean: () => Promise.resolve(makeFakePost()) });
    await reportService.submitReport(REPORTER_ID, {
      contentType: 'post',
      contentId:   POST_ID,
      reason:      'spam',
    });
    // submitReport only returns { success: true } — no reporter data
    // The saved document has reporterAccountId, but that's never returned
    const result = await reportService.submitReport(REPORTER_ID, {
      contentType: 'post',
      contentId:   POST_ID,
      reason:      'spam',
    });
    expect(result).not.toHaveProperty('reporterAccountId');
  });
});

// ─── getOpenReportsQueue ──────────────────────────────────────────────────────

describe('getOpenReportsQueue', () => {
  it('does NOT include reporterAccountId in returned reports', async () => {
    const mockReport = makeFakeReport({ isCrisisFlagged: true });
    mockReportFind.mockReturnValueOnce({
      sort: () => ({
        limit: () => ({
          lean: () => Promise.resolve([mockReport]),
        }),
      }),
    });

    const result = await reportService.getOpenReportsQueue();
    expect(result.reports[0]).not.toHaveProperty('reporterAccountId');
  });

  it('crisis-flagged reports sorted first (mongo sort includes isCrisisFlagged: -1)', async () => {
    let sortArg: unknown;
    mockReportFind.mockReturnValueOnce({
      sort: (arg: unknown) => {
        sortArg = arg;
        return { limit: () => ({ lean: () => Promise.resolve([]) }) };
      },
    });

    await reportService.getOpenReportsQueue();

    expect(sortArg).toMatchObject({ isCrisisFlagged: -1 });
  });
});

// ─── actionReport ─────────────────────────────────────────────────────────────

describe('actionReport', () => {
  it('throws 403 if moderator tries PERMANENT_BAN', async () => {
    mockReportFindById.mockResolvedValueOnce(makeFakeReport());
    await expect(
      reportService.actionReport(MOD_ID, 'report-id', 'PERMANENT_BAN', false)
    ).rejects.toThrow('admin privileges');
  });

  it('allows admin to issue PERMANENT_BAN', async () => {
    const report = makeFakeReport();
    mockReportFindById.mockResolvedValueOnce(report);
    await reportService.actionReport(MOD_ID, 'report-id', 'PERMANENT_BAN', true);
    expect(report.save).toHaveBeenCalled();
  });

  it('throws 404 when report not found', async () => {
    mockReportFindById.mockResolvedValueOnce(null);
    await expect(
      reportService.actionReport(MOD_ID, 'bad-id', 'DISMISS', false)
    ).rejects.toThrow('Report not found');
  });

  it('creates an action log entry for every action', async () => {
    const report = makeFakeReport();
    mockReportFindById.mockResolvedValueOnce(report);
    await reportService.actionReport(MOD_ID, 'report-id', 'DISMISS', false);
    expect(report.actionLog.length).toBe(1);
    expect(report.save).toHaveBeenCalled();
  });

  it('DISMISS sets status to actioned and sets resolvedAt', async () => {
    const report = makeFakeReport();
    mockReportFindById.mockResolvedValueOnce(report);
    await reportService.actionReport(MOD_ID, 'report-id', 'DISMISS', false);
    expect(report.status).toBe('actioned');
    expect(report.resolvedAt).toBeInstanceOf(Date);
  });

  it('ESCALATE_TO_ADMIN does not change status to actioned (stays open)', async () => {
    const report = makeFakeReport();
    mockReportFindById.mockResolvedValueOnce(report);
    await reportService.actionReport(MOD_ID, 'report-id', 'ESCALATE_TO_ADMIN', false);
    expect(report.status).toBe('open');
  });
});
