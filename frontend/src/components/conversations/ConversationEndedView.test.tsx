/**
 * ConversationEndedView.test.tsx — Unit tests for the ConversationEndedView component.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import conversationsReducer from '../../features/conversations/conversationsSlice';
import type { ConversationDetail, PublicMessage } from '../../features/conversations/conversationsSlice';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockSubmitFeedback = jest.fn().mockReturnValue(() => Promise.resolve());
jest.mock('../../features/conversations/conversationsThunks', () => ({
  submitFeedbackThunk: (...args: unknown[]) => mockSubmitFeedback(...args),
}));

// ─── Test data ────────────────────────────────────────────────────────────────

function makeStore() {
  return configureStore({ reducer: { conversations: conversationsReducer } });
}

const BASE_CONV: ConversationDetail = {
  id:                 'conv_1',
  contextCategoryId:  'loneliness',
  contextPostId:      null,
  state:              'ended_by_user',
  myAliasSnapshot:    { aliasName: 'MyAlias', avatarSeed: 'seedM' },
  otherAliasSnapshot: { aliasName: 'OtherAlias', avatarSeed: 'seedO' },
  requestedAt:        new Date().toISOString(),
  matchedAt:          new Date().toISOString(),
  startedAt:          new Date().toISOString(),
  expiresAt:          null,
  endedAt:            new Date().toISOString(),
  endReason:          'ended_by_user',
  feedbackSubmitted:  false,
  transcriptVisible:  true,
};

const MESSAGES: PublicMessage[] = [
  {
    id:                  'msg_1',
    senderAliasSnapshot: 'MyAlias',
    senderAvatarSeed:    'seedM',
    body:                'Hello',
    contactInfoWarning:  false,
    sentAt:              new Date().toISOString(),
    isDeleted:           false,
  },
  {
    id:                  'msg_2',
    senderAliasSnapshot: 'OtherAlias',
    senderAvatarSeed:    'seedO',
    body:                'Hi back',
    contactInfoWarning:  false,
    sentAt:              new Date().toISOString(),
    isDeleted:           false,
  },
];

import ConversationEndedView from './ConversationEndedView';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ConversationEndedView', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows end reason label', () => {
    render(
      <Provider store={makeStore()}>
        <ConversationEndedView
          conversation={BASE_CONV}
          messages={MESSAGES}
          myAliasName="MyAlias"
        />
      </Provider>
    );
    expect(screen.getByText(/This conversation was ended/i)).toBeInTheDocument();
  });

  it('renders transcript messages when transcriptVisible is true', () => {
    render(
      <Provider store={makeStore()}>
        <ConversationEndedView
          conversation={BASE_CONV}
          messages={MESSAGES}
          myAliasName="MyAlias"
        />
      </Provider>
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi back')).toBeInTheDocument();
  });

  it('hides transcript when transcriptVisible is false', () => {
    render(
      <Provider store={makeStore()}>
        <ConversationEndedView
          conversation={{ ...BASE_CONV, transcriptVisible: false }}
          messages={MESSAGES}
          myAliasName="MyAlias"
        />
      </Provider>
    );
    expect(screen.getByText(/Transcript no longer available/i)).toBeInTheDocument();
    expect(screen.queryByText('Hello')).not.toBeInTheDocument();
  });

  it('shows feedback prompt when feedbackSubmitted is false', () => {
    render(
      <Provider store={makeStore()}>
        <ConversationEndedView
          conversation={BASE_CONV}
          messages={MESSAGES}
          myAliasName="MyAlias"
        />
      </Provider>
    );
    expect(screen.getByText(/Was this conversation helpful/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Yes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /No, this conversation was not helpful/i })).toBeInTheDocument();
  });

  it('hides feedback prompt when already submitted', () => {
    render(
      <Provider store={makeStore()}>
        <ConversationEndedView
          conversation={{ ...BASE_CONV, feedbackSubmitted: true }}
          messages={MESSAGES}
          myAliasName="MyAlias"
        />
      </Provider>
    );
    expect(screen.queryByText(/Was this conversation helpful/i)).not.toBeInTheDocument();
  });

  it('calls submitFeedbackThunk when Yes is clicked', () => {
    render(
      <Provider store={makeStore()}>
        <ConversationEndedView
          conversation={BASE_CONV}
          messages={MESSAGES}
          myAliasName="MyAlias"
        />
      </Provider>
    );
    fireEvent.click(screen.getByRole('button', { name: /Yes/i }));
    expect(mockSubmitFeedback).toHaveBeenCalledWith('conv_1', true);
  });

  it('calls submitFeedbackThunk with false when Not really is clicked', () => {
    render(
      <Provider store={makeStore()}>
        <ConversationEndedView
          conversation={BASE_CONV}
          messages={MESSAGES}
          myAliasName="MyAlias"
        />
      </Provider>
    );
    fireEvent.click(screen.getByRole('button', { name: /No, this conversation was not helpful/i }));
    expect(mockSubmitFeedback).toHaveBeenCalledWith('conv_1', false);
  });

  it('shows no re-contact message', () => {
    render(
      <Provider store={makeStore()}>
        <ConversationEndedView
          conversation={BASE_CONV}
          messages={MESSAGES}
          myAliasName="MyAlias"
        />
      </Provider>
    );
    expect(screen.getByText(/temporary by design/i)).toBeInTheDocument();
  });
});
