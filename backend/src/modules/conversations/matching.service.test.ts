/**
 * matching.service.test.ts — Unit tests for conversation match request logic.
 */
import { Types } from 'mongoose';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockConversationFindOne   = jest.fn();
const mockConversationFind      = jest.fn();
const mockConversationCreate    = jest.fn();
const mockConversationCountDocs = jest.fn();
const mockConversationUpdateOne = jest.fn();
const mockConversationFindById  = jest.fn();

jest.mock('./conversation.model', () => ({
  ConversationModel: {
    findOne:        (...args: unknown[]) => mockConversationFindOne(...args),
    find:           (...args: unknown[]) => mockConversationFind(...args),
    create:         (...args: unknown[]) => mockConversationCreate(...args),
    countDocuments: (...args: unknown[]) => mockConversationCountDocs(...args),
    updateOne:      (...args: unknown[]) => mockConversationUpdateOne(...args),
    findById:       (...args: unknown[]) => mockConversationFindById(...args),
  },
}));

const mockUserFindById = jest.fn();
jest.mock('../users/user.model', () => ({
  UserModel: { findById: (...args: unknown[]) => mockUserFindById(...args) },
}));

const mockBlockFind = jest.fn();
jest.mock('../blocks/block.model', () => ({
  BlockModel: { find: (...args: unknown[]) => mockBlockFind(...args) },
}));

// ─── Test data ────────────────────────────────────────────────────────────────

const ACCOUNT_ID_A  = new Types.ObjectId().toString();
const ACCOUNT_ID_B  = new Types.ObjectId().toString();
const CATEGORY_ID   = 'loneliness';
const CONV_ID       = new Types.ObjectId().toString();
const PARTNER_CONV_ID = new Types.ObjectId().toString();

const mockUser = (accountId: string) => ({
  _id:             accountId,
  aliasName:       'TestAlias',
  aliasAvatarSeed: 'seed123',
});

const mockConversation = (overrides: Partial<Record<string, unknown>> = {}) => ({
  _id:                   new Types.ObjectId(CONV_ID),
  participantAccountIds: [new Types.ObjectId(ACCOUNT_ID_A)],
  participantAliasSnapshots: [
    { accountId: new Types.ObjectId(ACCOUNT_ID_A), aliasName: 'AliaA', avatarSeed: 'seedA' },
  ],
  contextCategoryId:     CATEGORY_ID,
  state:                 'requested',
  requestedAt:           new Date(),
  matchRequestExpiresAt: new Date(Date.now() + 900_000),
  ...overrides,
});

// ─── Import subject under test ─────────────────────────────────────────────

import * as matchingService from './matching.service';
import { CONVERSATION_STATE } from '../../constants/conversationStates';

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => jest.clearAllMocks());

describe('createMatchRequest', () => {
  it('creates a REQUESTED conversation when no match is available', async () => {
    mockUserFindById.mockReturnValueOnce({ lean: () => Promise.resolve(mockUser(ACCOUNT_ID_A)) });
    mockConversationFindOne
      // Check existing active conversation — none found
      .mockReturnValueOnce(Promise.resolve(null));
    mockConversationCountDocs.mockReturnValueOnce(Promise.resolve(0));
    mockConversationCreate.mockReturnValueOnce(
      Promise.resolve(mockConversation({ _id: new Types.ObjectId(CONV_ID) }))
    );
    // findMatch: no candidate found
    mockBlockFind.mockReturnValue({ lean: () => Promise.resolve([]) });
    mockConversationFindOne
      .mockReturnValueOnce({ sort: () => Promise.resolve(null) });  // no candidate
    mockConversationFindById.mockReturnValueOnce(
      Promise.resolve(mockConversation())
    );

    const result = await matchingService.createMatchRequest(ACCOUNT_ID_A, {
      contextCategoryId: CATEGORY_ID,
    });

    expect(result.matched).toBe(false);
    expect(mockConversationCreate).toHaveBeenCalledTimes(1);
  });

  it('throws ERR_ACTIVE_CONVERSATION_EXISTS when active conversation exists', async () => {
    mockUserFindById.mockReturnValueOnce({ lean: () => Promise.resolve(mockUser(ACCOUNT_ID_A)) });
    mockConversationFindOne.mockReturnValueOnce(
      Promise.resolve(mockConversation({ state: 'active' }))
    );

    await expect(
      matchingService.createMatchRequest(ACCOUNT_ID_A, { contextCategoryId: CATEGORY_ID })
    ).rejects.toMatchObject({ code: 'ERR_ACTIVE_CONVERSATION_EXISTS' });
  });

  it('throws ERR_DAILY_CONVERSATION_LIMIT when limit exceeded', async () => {
    mockUserFindById.mockReturnValueOnce({ lean: () => Promise.resolve(mockUser(ACCOUNT_ID_A)) });
    mockConversationFindOne.mockReturnValueOnce(Promise.resolve(null));
    mockConversationCountDocs.mockReturnValueOnce(Promise.resolve(10)); // at limit

    await expect(
      matchingService.createMatchRequest(ACCOUNT_ID_A, { contextCategoryId: CATEGORY_ID })
    ).rejects.toMatchObject({ code: 'ERR_DAILY_CONVERSATION_LIMIT' });
  });
});

describe('findMatch', () => {
  it('matches two compatible requests in the same category', async () => {
    const partnerAccountId = ACCOUNT_ID_B;

    mockBlockFind.mockReturnValue({ lean: () => Promise.resolve([]) });

    const partnerConv = mockConversation({
      _id:                   new Types.ObjectId(PARTNER_CONV_ID),
      participantAccountIds: [new Types.ObjectId(partnerAccountId)],
      participantAliasSnapshots: [
        { accountId: new Types.ObjectId(partnerAccountId), aliasName: 'AliasB', avatarSeed: 'seedB' },
      ],
    });

    mockConversationFindOne.mockReturnValueOnce({
      sort: () => Promise.resolve(partnerConv),
    });

    // Load partner user
    mockUserFindById.mockReturnValueOnce({ lean: () => Promise.resolve(mockUser(partnerAccountId)) });

    mockConversationUpdateOne.mockResolvedValue({});

    // Update myConversation
    mockConversationUpdateOne.mockResolvedValue({});

    const myConv = mockConversation({
      _id: new Types.ObjectId(CONV_ID),
      participantAliasSnapshots: [
        { accountId: new Types.ObjectId(ACCOUNT_ID_A), aliasName: 'AliaA', avatarSeed: 'seedA' },
      ],
    });
    mockConversationFindById
      .mockResolvedValueOnce(myConv)      // load myConversation
      .mockResolvedValueOnce({ ...partnerConv, state: 'matched_pending' }); // updatedConversation

    const result = await matchingService.findMatch(CONV_ID, ACCOUNT_ID_A, CATEGORY_ID);

    expect(result.matched).toBe(true);
    expect(result.partnerId).toBe(partnerAccountId);
  });

  it('does not match same account with itself', async () => {
    mockBlockFind.mockReturnValue({ lean: () => Promise.resolve([]) });
    // No candidate found when blocked IDs include self
    mockConversationFindOne.mockReturnValueOnce({
      sort: () => Promise.resolve(null),
    });
    mockConversationFindById.mockResolvedValueOnce(mockConversation());

    const result = await matchingService.findMatch(CONV_ID, ACCOUNT_ID_A, CATEGORY_ID);
    expect(result.matched).toBe(false);
  });

  it('does not match blocked users', async () => {
    // A blocked B
    mockBlockFind
      .mockReturnValueOnce({ lean: () => Promise.resolve([{ blockedAccountId: new Types.ObjectId(ACCOUNT_ID_B) }]) })
      .mockReturnValueOnce({ lean: () => Promise.resolve([]) });

    mockConversationFindOne.mockReturnValueOnce({
      sort: () => Promise.resolve(null), // no match because $nin excludes blocked
    });
    mockConversationFindById.mockResolvedValueOnce(mockConversation());

    const result = await matchingService.findMatch(CONV_ID, ACCOUNT_ID_A, CATEGORY_ID);
    expect(result.matched).toBe(false);
  });
});

describe('expireMatchRequest', () => {
  it('sets state to NO_MATCH_FOUND', async () => {
    mockConversationUpdateOne.mockResolvedValue({});

    await matchingService.expireMatchRequest(CONV_ID);

    expect(mockConversationUpdateOne).toHaveBeenCalledWith(
      { _id: CONV_ID, state: CONVERSATION_STATE.REQUESTED },
      expect.objectContaining({
        $set: expect.objectContaining({ state: CONVERSATION_STATE.NO_MATCH_FOUND }),
      })
    );
  });
});

describe('cancelMatchRequest', () => {
  it('cancels a REQUESTED conversation', async () => {
    mockConversationFindById.mockResolvedValueOnce(
      mockConversation({ state: CONVERSATION_STATE.REQUESTED })
    );
    mockConversationUpdateOne.mockResolvedValue({});

    await matchingService.cancelMatchRequest(ACCOUNT_ID_A, CONV_ID);

    expect(mockConversationUpdateOne).toHaveBeenCalledWith(
      { _id: CONV_ID },
      expect.objectContaining({
        $set: expect.objectContaining({
          state:     CONVERSATION_STATE.NO_MATCH_FOUND,
          endReason: 'cancelled_by_user',
        }),
      })
    );
  });

  it('throws ERR_NOT_PARTICIPANT if caller is not a participant', async () => {
    const anotherAccount = new Types.ObjectId().toString();
    mockConversationFindById.mockResolvedValueOnce(
      mockConversation({ state: CONVERSATION_STATE.REQUESTED })
    );

    await expect(
      matchingService.cancelMatchRequest(anotherAccount, CONV_ID)
    ).rejects.toMatchObject({ code: 'ERR_NOT_PARTICIPANT' });
  });

  it('throws when conversation is not REQUESTED', async () => {
    mockConversationFindById.mockResolvedValueOnce(
      mockConversation({ state: CONVERSATION_STATE.ACTIVE })
    );

    await expect(
      matchingService.cancelMatchRequest(ACCOUNT_ID_A, CONV_ID)
    ).rejects.toMatchObject({ code: 'ERR_ACTIVE_CONVERSATION_EXISTS' });
  });
});
