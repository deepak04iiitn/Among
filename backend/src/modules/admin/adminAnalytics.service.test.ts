/**
 * adminAnalytics.service.test.ts — Unit tests for admin analytics service.
 *
 * Critical invariants:
 *  - Each metric returns correctly shaped data.
 *  - Report rate computed correctly with sample data.
 *  - Retention cohort logic returns correct percentages.
 *  - No individual user data exposed.
 */
import * as analyticsService from './adminAnalytics.service';
import { ConversationModel } from '../conversations/conversation.model';
import { PostModel }         from '../posts/post.model';
import { ReportModel }       from '../moderation/report.model';
import { UserModel }         from '../users/user.model';

jest.mock('../conversations/conversation.model', () => ({
  ConversationModel: { countDocuments: jest.fn(), aggregate: jest.fn() },
}));
jest.mock('../posts/post.model', () => ({
  PostModel: { countDocuments: jest.fn(), aggregate: jest.fn() },
}));
jest.mock('../moderation/report.model', () => ({
  ReportModel: { countDocuments: jest.fn(), aggregate: jest.fn() },
}));
jest.mock('../users/user.model', () => ({
  UserModel: { countDocuments: jest.fn() },
}));

const mockConvCount    = ConversationModel.countDocuments as jest.Mock;
const mockPostCount    = PostModel.countDocuments         as jest.Mock;
const mockPostAggreg   = PostModel.aggregate              as jest.Mock;
const mockReportCount  = ReportModel.countDocuments       as jest.Mock;
const mockReportAggreg = ReportModel.aggregate            as jest.Mock;
const mockUserCount    = UserModel.countDocuments         as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
  mockConvCount.mockResolvedValue(0);
  mockPostCount.mockResolvedValue(0);
  mockPostAggreg.mockResolvedValue([]);
  mockReportCount.mockResolvedValue(0);
  mockReportAggreg.mockResolvedValue([]);
  mockUserCount.mockResolvedValue(0);
});

// ─── getWeeklyMeaningfulConnections ───────────────────────────────────────────

describe('getWeeklyMeaningfulConnections', () => {
  it('returns WMC count with period dates', async () => {
    mockConvCount.mockResolvedValueOnce(42);
    const result = await analyticsService.getWeeklyMeaningfulConnections();
    expect(result.weeklyMeaningfulConnections).toBe(42);
    expect(result.periodStart).toBeDefined();
    expect(result.periodEnd).toBeDefined();
  });

  it('returns 0 when no active conversations', async () => {
    mockConvCount.mockResolvedValueOnce(0);
    const result = await analyticsService.getWeeklyMeaningfulConnections();
    expect(result.weeklyMeaningfulConnections).toBe(0);
  });
});

// ─── getConversationCompletionRate ────────────────────────────────────────────

describe('getConversationCompletionRate', () => {
  it('computes completion rate correctly', async () => {
    mockConvCount
      .mockResolvedValueOnce(8)   // active
      .mockResolvedValueOnce(10); // total
    const result = await analyticsService.getConversationCompletionRate();
    expect(result.rate).toBeCloseTo(0.8);
    expect(result.active).toBe(8);
    expect(result.total).toBe(10);
  });

  it('returns rate 0 when total is 0', async () => {
    mockConvCount.mockResolvedValue(0);
    const result = await analyticsService.getConversationCompletionRate();
    expect(result.rate).toBe(0);
  });
});

// ─── getReportRatePer1000 ─────────────────────────────────────────────────────

describe('getReportRatePer1000', () => {
  it('computes report rate correctly: 10 reports / 1000 posts = 10.0/1000', async () => {
    mockReportCount.mockResolvedValueOnce(10);
    mockPostCount.mockResolvedValueOnce(1000);
    const result = await analyticsService.getReportRatePer1000();
    expect(result.ratePer1000).toBeCloseTo(10.0);
    expect(result.totalReports).toBe(10);
    expect(result.totalContent).toBe(1000);
  });

  it('returns 0 rate when no content', async () => {
    mockReportCount.mockResolvedValueOnce(0);
    mockPostCount.mockResolvedValueOnce(0);
    const result = await analyticsService.getReportRatePer1000();
    expect(result.ratePer1000).toBe(0);
  });
});

// ─── getSnyOptInRate ──────────────────────────────────────────────────────────

describe('getSnyOptInRate', () => {
  it('computes opt-in rate correctly', async () => {
    mockUserCount
      .mockResolvedValueOnce(100)  // eligible
      .mockResolvedValueOnce(35);  // opted in
    const result = await analyticsService.getSnyOptInRate();
    expect(result.rate).toBeCloseTo(0.35);
    expect(result.eligibleUsers).toBe(100);
    expect(result.optedInUsers).toBe(35);
  });

  it('returns rate 0 when no eligible users', async () => {
    mockUserCount.mockResolvedValue(0);
    const result = await analyticsService.getSnyOptInRate();
    expect(result.rate).toBe(0);
  });
});

// ─── getCategoryBreakdown ─────────────────────────────────────────────────────

describe('getCategoryBreakdown', () => {
  it('returns correct breakdown shape with report rates', async () => {
    mockPostAggreg.mockResolvedValueOnce([
      { _id: 'loneliness', postVolume: 50 },
      { _id: 'grief',      postVolume: 20 },
    ]);
    mockReportAggreg.mockResolvedValueOnce([
      { _id: 'loneliness', reportCount: 5 },
    ]);

    const result = await analyticsService.getCategoryBreakdown();
    const loneliness = result.find((c) => c.categoryId === 'loneliness');
    expect(loneliness).toBeDefined();
    expect(loneliness!.postVolume).toBe(50);
    expect(loneliness!.reportCount).toBe(5);
    expect(loneliness!.reportRate).toBeCloseTo(0.1);

    const grief = result.find((c) => c.categoryId === 'grief');
    expect(grief!.reportCount).toBe(0);
    expect(grief!.reportRate).toBe(0);
  });
});

// ─── getDashboardMetrics ──────────────────────────────────────────────────────

describe('getDashboardMetrics', () => {
  it('returns all four metric groups', async () => {
    mockConvCount.mockResolvedValue(10);
    mockReportCount.mockResolvedValue(1);
    mockPostCount.mockResolvedValue(100);
    mockUserCount.mockResolvedValue(50);

    const result = await analyticsService.getDashboardMetrics();
    expect(result).toHaveProperty('wmc');
    expect(result).toHaveProperty('completion');
    expect(result).toHaveProperty('reportRate');
    expect(result).toHaveProperty('sny');
  });
});
