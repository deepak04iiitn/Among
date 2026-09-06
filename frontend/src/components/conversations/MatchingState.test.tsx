/**
 * MatchingState.test.tsx — Unit tests for the MatchingState component.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import conversationsReducer, {
  type ConversationsState,
} from '../../features/conversations/conversationsSlice';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockCancelMatch = jest.fn().mockReturnValue(() => Promise.resolve());
jest.mock('../../features/conversations/conversationsThunks', () => ({
  cancelMatchRequestThunk: (...args: unknown[]) => mockCancelMatch(...args),
}));

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeStore(overrides: Partial<ConversationsState> = {}) {
  return configureStore({
    reducer: { conversations: conversationsReducer },
    preloadedState: {
      conversations: {
        list:                 [],
        activeConversationId: null,
        activeDetail:         null,
        messages:             {},
        messageCursors:       {},
        listStatus:           'idle' as const,
        detailStatus:         'idle' as const,
        messagesStatus:       'idle' as const,
        matchingRequestId:    null,
        matchingState:        'searching' as const,
        expiryWarning:        null,
        contactInfoWarning:   false,
        error:                null,
        ...overrides,
      },
    },
  });
}

// ─── Import component ─────────────────────────────────────────────────────────

import MatchingState from './MatchingState';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MatchingState', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders searching state', () => {
    const store = makeStore({ matchingState: 'searching', matchingRequestId: 'req_1' });
    render(<Provider store={store}><MatchingState /></Provider>);
    expect(screen.getByText(/Looking for someone available/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls cancel thunk when Cancel is clicked', () => {
    const store = makeStore({ matchingState: 'searching', matchingRequestId: 'req_1' });
    render(<Provider store={store}><MatchingState /></Provider>);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockCancelMatch).toHaveBeenCalledWith('req_1');
  });

  it('renders no_match state with browse link', () => {
    const store = makeStore({ matchingState: 'no_match' });
    render(<Provider store={store}><MatchingState /></Provider>);
    expect(screen.getByText(/No one was available right now/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Browse experiences/i })).toBeInTheDocument();
  });

  it('shows elapsed time in searching state', () => {
    const store = makeStore({ matchingState: 'searching', matchingRequestId: 'req_1' });
    render(<Provider store={store}><MatchingState /></Provider>);
    // Initial 0s display
    expect(screen.getByText('0s')).toBeInTheDocument();
  });
});
