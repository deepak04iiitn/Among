/**
 * experienceGraph.service.test.ts — Unit tests for the experience graph service.
 */
import { Types } from 'mongoose';
import { ExperienceGraphModel } from './experienceGraph.model';
import * as service from './experienceGraph.service';
import { PRIMARY_REACTION_IDS } from '../../constants/reactionTypes';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('./experienceGraph.model', () => ({
  ExperienceGraphModel: {
    findOne:   jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
  },
}));

const mockFindOne  = ExperienceGraphModel.findOne  as jest.Mock;
const mockUpdateOne = ExperienceGraphModel.updateOne as jest.Mock;
const mockDeleteOne = ExperienceGraphModel.deleteOne as jest.Mock;

const ACCOUNT_ID = String(new Types.ObjectId());
const POST_ID    = String(new Types.ObjectId());
const CONV_ID    = String(new Types.ObjectId());

function mockGraph(experiences: Partial<{
  categoryId: string;
  snyOptIn: boolean;
  primaryReactionHistory: Array<{ reaction: string; postId: Types.ObjectId; reactedAt: Date }>;
  conversationsEntered: Array<{ conversationId: Types.ObjectId; enteredAt: Date }>;
  hasPostedAbout: boolean;
  lastUpdatedAt: Date;
}>[]) {
  return {
    accountId:   new Types.ObjectId(ACCOUNT_ID),
    experiences: experiences.map((e) => ({
      categoryId:             e.categoryId ?? 'anxiety',
      hasPostedAbout:         e.hasPostedAbout ?? false,
      primaryReactionHistory: e.primaryReactionHistory ?? [],
      conversationsEntered:   e.conversationsEntered ?? [],
      snyOptIn:               e.snyOptIn ?? false,
      lastUpdatedAt:          e.lastUpdatedAt ?? new Date(),
    })),
    updatedAt: new Date(),
  };
}

beforeEach(() => {
  jest.resetAllMocks();
  mockUpdateOne.mockResolvedValue({ acknowledged: true });
  mockDeleteOne.mockResolvedValue({ acknowledged: true });
});

// ─── getSurvivedCategories ────────────────────────────────────────────────────

describe('getSurvivedCategories', () => {
  it('returns categories with PAST reaction AND snyOptIn=true', async () => {
    mockFindOne.mockReturnValueOnce({
      lean: () => Promise.resolve(mockGraph([
        {
          categoryId: 'anxiety',
          snyOptIn: true,
          primaryReactionHistory: [{ reaction: PRIMARY_REACTION_IDS.PAST, postId: new Types.ObjectId(), reactedAt: new Date() }],
        },
      ])),
    });

    const result = await service.getSurvivedCategories(ACCOUNT_ID);
    expect(result).toEqual(['anxiety']);
  });

  it('excludes categories with snyOptIn=false even if PAST reaction present', async () => {
    mockFindOne.mockReturnValueOnce({
      lean: () => Promise.resolve(mockGraph([
        {
          categoryId: 'depression',
          snyOptIn: false,
          primaryReactionHistory: [{ reaction: PRIMARY_REACTION_IDS.PAST, postId: new Types.ObjectId(), reactedAt: new Date() }],
        },
      ])),
    });

    const result = await service.getSurvivedCategories(ACCOUNT_ID);
    expect(result).toHaveLength(0);
  });

  it('excludes categories with snyOptIn=true but no PAST reaction', async () => {
    mockFindOne.mockReturnValueOnce({
      lean: () => Promise.resolve(mockGraph([
        {
          categoryId: 'grief',
          snyOptIn: true,
          primaryReactionHistory: [{ reaction: PRIMARY_REACTION_IDS.CURRENT, postId: new Types.ObjectId(), reactedAt: new Date() }],
        },
      ])),
    });

    const result = await service.getSurvivedCategories(ACCOUNT_ID);
    expect(result).toHaveLength(0);
  });

  it('returns empty array when no graph exists', async () => {
    mockFindOne.mockReturnValueOnce({ lean: () => Promise.resolve(null) });
    const result = await service.getSurvivedCategories(ACCOUNT_ID);
    expect(result).toEqual([]);
  });
});

// ─── deleteExperienceGraph ────────────────────────────────────────────────────

describe('deleteExperienceGraph', () => {
  it('calls deleteOne with the correct accountId', async () => {
    await service.deleteExperienceGraph(ACCOUNT_ID);
    expect(mockDeleteOne).toHaveBeenCalledWith({
      accountId: new Types.ObjectId(ACCOUNT_ID),
    });
  });
});

// ─── exportExperienceData ─────────────────────────────────────────────────────

describe('exportExperienceData', () => {
  it('returns all data fields without other users data', async () => {
    const reactedAt  = new Date('2025-01-01T00:00:00Z');
    const enteredAt  = new Date('2025-02-01T00:00:00Z');
    const postId     = new Types.ObjectId(POST_ID);
    const convId     = new Types.ObjectId(CONV_ID);

    mockFindOne.mockReturnValueOnce({
      lean: () => Promise.resolve(mockGraph([
        {
          categoryId:             'anxiety',
          hasPostedAbout:         true,
          snyOptIn:               true,
          lastUpdatedAt:          reactedAt,
          primaryReactionHistory: [{ reaction: 'past', postId, reactedAt }],
          conversationsEntered:   [{ conversationId: convId, enteredAt }],
        },
      ])),
    });

    const result = await service.exportExperienceData(ACCOUNT_ID);
    expect(result.accountId).toBe(ACCOUNT_ID);
    expect(result.experiences).toHaveLength(1);
    expect(result.experiences[0]?.categoryId).toBe('anxiety');
    expect(result.experiences[0]?.primaryReactionHistory[0]?.postId).toBe(POST_ID);
    expect(result.experiences[0]?.conversationsEntered[0]?.conversationId).toBe(CONV_ID);
    expect(result.exportedAt).toBeDefined();
  });

  it('returns empty experiences when no graph exists', async () => {
    mockFindOne.mockReturnValueOnce({ lean: () => Promise.resolve(null) });
    const result = await service.exportExperienceData(ACCOUNT_ID);
    expect(result.experiences).toHaveLength(0);
  });
});

// ─── getExperienceHistory ─────────────────────────────────────────────────────

describe('getExperienceHistory', () => {
  it('returns human-readable history with counts', async () => {
    mockFindOne.mockReturnValueOnce({
      lean: () => Promise.resolve(mockGraph([
        {
          categoryId:             'grief',
          hasPostedAbout:         false,
          snyOptIn:               true,
          primaryReactionHistory: [
            { reaction: 'past', postId: new Types.ObjectId(), reactedAt: new Date() },
            { reaction: 'current', postId: new Types.ObjectId(), reactedAt: new Date() },
          ],
          conversationsEntered: [
            { conversationId: new Types.ObjectId(), enteredAt: new Date() },
          ],
        },
      ])),
    });

    const result = await service.getExperienceHistory(ACCOUNT_ID);
    expect(result[0]?.categoryId).toBe('grief');
    expect(result[0]?.pastReactionCount).toBe(1);
    expect(result[0]?.conversationCount).toBe(1);
    expect(result[0]?.snyOptIn).toBe(true);
  });
});
