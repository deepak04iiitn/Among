/**
 * MessageBubble.test.tsx — Unit tests for the MessageBubble component.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import MessageBubble from './MessageBubble';
import type { PublicMessage } from '../../features/conversations/conversationsSlice';

// ─── Test data ────────────────────────────────────────────────────────────────

const makeMessage = (overrides: Partial<PublicMessage> = {}): PublicMessage => ({
  id:                  'msg_1',
  senderAliasSnapshot: 'Alias A',
  senderAvatarSeed:    'seedA',
  body:                'Hello there',
  contactInfoWarning:  false,
  sentAt:              new Date('2026-09-06T10:00:00Z').toISOString(),
  isDeleted:           false,
  ...overrides,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MessageBubble', () => {
  it('renders message body', () => {
    render(
      <MessageBubble
        message={makeMessage()}
        isOwn={false}
        showAlias={true}
      />
    );
    expect(screen.getByText('Hello there')).toBeInTheDocument();
  });

  it('shows alias when showAlias is true', () => {
    render(
      <MessageBubble
        message={makeMessage()}
        isOwn={false}
        showAlias={true}
      />
    );
    expect(screen.getByText('Alias A')).toBeInTheDocument();
  });

  it('does not show alias when showAlias is false', () => {
    render(
      <MessageBubble
        message={makeMessage()}
        isOwn={false}
        showAlias={false}
      />
    );
    expect(screen.queryByText('Alias A')).not.toBeInTheDocument();
  });

  it('marks own message with data-testid own-message', () => {
    render(
      <MessageBubble
        message={makeMessage()}
        isOwn={true}
        showAlias={false}
      />
    );
    expect(screen.getByTestId('own-message')).toBeInTheDocument();
  });

  it('marks other-party message with data-testid other-message', () => {
    render(
      <MessageBubble
        message={makeMessage()}
        isOwn={false}
        showAlias={false}
      />
    );
    expect(screen.getByTestId('other-message')).toBeInTheDocument();
  });

  it('shows deleted message placeholder', () => {
    render(
      <MessageBubble
        message={makeMessage({ isDeleted: true, body: 'original' })}
        isOwn={false}
        showAlias={false}
      />
    );
    expect(screen.getByText('[Message removed]')).toBeInTheDocument();
    expect(screen.queryByText('original')).not.toBeInTheDocument();
  });

  it('does not expose senderAccountId', () => {
    const { container } = render(
      <MessageBubble
        message={makeMessage()}
        isOwn={false}
        showAlias={false}
      />
    );
    expect(container.innerHTML).not.toContain('senderAccountId');
    expect(container.innerHTML).not.toContain('accountId');
  });
});
