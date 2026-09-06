/**
 * message.service.test.ts — Unit tests for message send, retrieve, and contact info detection.
 */
import { Types } from 'mongoose';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockConvFindById     = jest.fn();
const mockConvUpdateOne    = jest.fn();
const mockMsgCreate        = jest.fn();
const mockMsgFind          = jest.fn();

jest.mock('./conversation.model', () => ({
  ConversationModel: {
    findById:   (...args: unknown[]) => mockConvFindById(...args),
    updateOne:  (...args: unknown[]) => mockConvUpdateOne(...args),
  },
}));

jest.mock('./message.model', () => ({
  MessageModel: {
    create: (...args: unknown[]) => mockMsgCreate(...args),
    find:   (...args: unknown[]) => mockMsgFind(...args),
  },
}));

// ─── Import subject ───────────────────────────────────────────────────────────

import * as messageService from './message.service';
import { CONVERSATION_STATE } from '../../constants/conversationStates';

// ─── Test data ────────────────────────────────────────────────────────────────

const ACCOUNT_A = new Types.ObjectId().toString();
const ACCOUNT_B = new Types.ObjectId().toString();
const CONV_ID   = new Types.ObjectId().toString();
const MSG_ID    = new Types.ObjectId().toString();

const makeConversation = (state: string = CONVERSATION_STATE.ACTIVE) => ({
  _id:                   new Types.ObjectId(CONV_ID),
  state,
  participantAccountIds: [new Types.ObjectId(ACCOUNT_A), new Types.ObjectId(ACCOUNT_B)],
  participantAliasSnapshots: [
    { accountId: new Types.ObjectId(ACCOUNT_A), aliasName: 'Alias A', avatarSeed: 'seedA' },
    { accountId: new Types.ObjectId(ACCOUNT_B), aliasName: 'Alias B', avatarSeed: 'seedB' },
  ],
});

const makeSentMessage = (overrides: Partial<Record<string, unknown>> = {}) => ({
  _id:                 new Types.ObjectId(MSG_ID),
  senderAliasSnapshot: 'Alias A',
  senderAvatarSeed:    'seedA',
  body:                'Hello there',
  contactInfoWarning:  false,
  sentAt:              new Date(),
  deletedAt:           null,
  ...overrides,
});

// ─── detectContactInfo ────────────────────────────────────────────────────────

describe('detectContactInfo', () => {
  it('detects phone numbers', () => {
    const result = messageService.detectContactInfo('Call me at +1 555 867 5309');
    expect(result.detected).toBe(true);
    expect(result.categories).toContain('phone');
  });

  it('detects email addresses', () => {
    const result = messageService.detectContactInfo('Reach me at alice@example.com');
    expect(result.detected).toBe(true);
    expect(result.categories).toContain('email');
  });

  it('detects social handles', () => {
    const result = messageService.detectContactInfo('Find me @alice_in_among');
    expect(result.detected).toBe(true);
    expect(result.categories).toContain('socialHandle');
  });

  it('does not flag regular text', () => {
    const result = messageService.detectContactInfo('I really relate to what you said');
    expect(result.detected).toBe(false);
    expect(result.categories).toHaveLength(0);
  });
});

// ─── sendMessage ─────────────────────────────────────────────────────────────

describe('sendMessage', () => {
  beforeEach(() => jest.resetAllMocks());

  it('sends a message to an ACTIVE conversation', async () => {
    mockConvFindById.mockResolvedValueOnce(makeConversation(CONVERSATION_STATE.ACTIVE));
    mockConvUpdateOne.mockResolvedValue({});
    mockMsgFind.mockReturnValueOnce({ lean: () => Promise.resolve([]) });
    mockMsgCreate.mockResolvedValueOnce(makeSentMessage());

    const result = await messageService.sendMessage(ACCOUNT_A, CONV_ID, 'Hello there');

    expect(result.message.body).toBe('Hello there');
    expect(result.contactInfoWarning).toBe(false);
    expect(result.newConversationState).toBe(CONVERSATION_STATE.ACTIVE);
  });

  it('transitions MATCHED_PENDING to ACTIVE on first message', async () => {
    mockConvFindById.mockResolvedValueOnce(makeConversation(CONVERSATION_STATE.MATCHED_PENDING));
    mockConvUpdateOne.mockResolvedValue({});
    mockMsgFind.mockReturnValueOnce({ lean: () => Promise.resolve([]) });
    mockMsgCreate.mockResolvedValueOnce(makeSentMessage());

    const result = await messageService.sendMessage(ACCOUNT_A, CONV_ID, 'Hi!');

    expect(result.newConversationState).toBe(CONVERSATION_STATE.ACTIVE);
    expect(mockConvUpdateOne).toHaveBeenCalledWith(
      { _id: CONV_ID },
      expect.objectContaining({
        $set: expect.objectContaining({ state: CONVERSATION_STATE.ACTIVE }),
      })
    );
  });

  it('rejects message to ended conversation', async () => {
    mockConvFindById.mockResolvedValueOnce(makeConversation(CONVERSATION_STATE.ENDED_BY_USER));

    await expect(
      messageService.sendMessage(ACCOUNT_A, CONV_ID, 'Too late')
    ).rejects.toMatchObject({ code: 'ERR_CONVERSATION_NOT_ACTIVE' });
  });

  it('rejects message from non-participant', async () => {
    const stranger = new Types.ObjectId().toString();
    mockConvFindById.mockResolvedValueOnce(makeConversation());

    await expect(
      messageService.sendMessage(stranger, CONV_ID, 'Hello')
    ).rejects.toMatchObject({ code: 'ERR_NOT_PARTICIPANT' });
  });

  it('sets contactInfoWarning=true when phone number detected', async () => {
    mockConvFindById.mockResolvedValueOnce(makeConversation(CONVERSATION_STATE.ACTIVE));
    mockConvUpdateOne.mockResolvedValue({});
    mockMsgFind.mockReturnValueOnce({ lean: () => Promise.resolve([]) }); // no previous warnings
    mockMsgCreate.mockResolvedValueOnce(makeSentMessage({ contactInfoWarning: true }));

    const result = await messageService.sendMessage(ACCOUNT_A, CONV_ID, 'Call me +1 555 123 4567');

    expect(result.contactInfoWarning).toBe(true);
    expect(result.warningCategories).toContain('phone');
    expect(result.isNewWarning).toBe(true);
  });

  it('does not set isNewWarning if phone already warned this conversation', async () => {
    mockConvFindById.mockResolvedValueOnce(makeConversation(CONVERSATION_STATE.ACTIVE));
    mockConvUpdateOne.mockResolvedValue({});
    // Previous message already had a phone warning (body contains a phone number)
    mockMsgFind.mockReturnValueOnce({
      lean: () => Promise.resolve([{ body: 'Old message +1 555 999 8888' }]),
    });
    mockMsgCreate.mockResolvedValueOnce(makeSentMessage({ contactInfoWarning: true }));

    const result = await messageService.sendMessage(ACCOUNT_A, CONV_ID, 'Call +1 555 999 8888 again');

    expect(result.isNewWarning).toBe(false);
  });

  it('does not expose senderAccountId in returned message', async () => {
    mockConvFindById.mockResolvedValueOnce(makeConversation(CONVERSATION_STATE.ACTIVE));
    mockConvUpdateOne.mockResolvedValue({});
    mockMsgFind.mockReturnValueOnce({ lean: () => Promise.resolve([]) });
    mockMsgCreate.mockResolvedValueOnce(makeSentMessage());

    const result = await messageService.sendMessage(ACCOUNT_A, CONV_ID, 'Hi');

    expect(result.message).not.toHaveProperty('senderAccountId');
  });

  it('rejects empty body', async () => {
    await expect(
      messageService.sendMessage(ACCOUNT_A, CONV_ID, '  ')
    ).rejects.toMatchObject({ code: 'ERR_INVALID_INPUT' });
  });
});

// ─── getMessages ─────────────────────────────────────────────────────────────

describe('getMessages', () => {
  beforeEach(() => jest.resetAllMocks());

  it('returns messages for a participant', async () => {
    mockConvFindById.mockReturnValueOnce({
      lean: () => Promise.resolve({
        _id:                   new Types.ObjectId(CONV_ID),
        participantAccountIds: [new Types.ObjectId(ACCOUNT_A), new Types.ObjectId(ACCOUNT_B)],
      }),
    });
    // For getMessages main query: find().sort().limit().lean()
    mockMsgFind.mockReturnValueOnce({
      sort: () => ({
        limit: () => ({
          lean: () => Promise.resolve([makeSentMessage()]),
        }),
      }),
    });

    const result = await messageService.getMessages(ACCOUNT_A, CONV_ID);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]).not.toHaveProperty('senderAccountId');
  });

  it('rejects getMessages for non-participant', async () => {
    const stranger = new Types.ObjectId().toString();
    mockConvFindById.mockReturnValueOnce({
      lean: () => Promise.resolve({
        _id:                   new Types.ObjectId(CONV_ID),
        participantAccountIds: [new Types.ObjectId(ACCOUNT_A), new Types.ObjectId(ACCOUNT_B)],
      }),
    });

    await expect(
      messageService.getMessages(stranger, CONV_ID)
    ).rejects.toMatchObject({ code: 'ERR_NOT_PARTICIPANT' });
  });
});
