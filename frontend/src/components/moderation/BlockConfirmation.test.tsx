/**
 * BlockConfirmation.test.tsx — Unit tests for BlockConfirmation component.
 *
 * Critical invariants:
 *  - Cancel does not block.
 *  - Confirm calls blockUserThunk.
 *  - Modal is accessible (role=dialog, aria-modal).
 *  - Escape key closes without blocking.
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import moderationReducer, {
  openBlockConfirm,
} from '../../features/moderation/moderationSlice';
import * as moderationThunks from '../../features/moderation/moderationThunks';
import BlockConfirmation from './BlockConfirmation';

jest.mock('../../features/moderation/moderationThunks', () => ({
  ...jest.requireActual('../../features/moderation/moderationThunks'),
  blockUserThunk: jest.fn(),
}));

const mockBlockUserThunk = moderationThunks.blockUserThunk as jest.Mock;

function makeStore(target?: string) {
  const store = configureStore({
    reducer: { moderation: moderationReducer },
  });
  if (target) store.dispatch(openBlockConfirm(target));
  return store;
}

function renderComp(store: ReturnType<typeof makeStore>) {
  return render(
    <Provider store={store}>
      <BlockConfirmation />
    </Provider>
  );
}

beforeEach(() => {
  jest.resetAllMocks();
  mockBlockUserThunk.mockReturnValue(() => Promise.resolve());
});

describe('BlockConfirmation', () => {
  it('renders nothing when no target is set', () => {
    const store = makeStore();
    renderComp(store);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders the confirmation dialog when a target is set', () => {
    const store = makeStore('acc-5');
    renderComp(store);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/block this person/i)).toBeInTheDocument();
  });

  it('has correct ARIA attributes', () => {
    const store = makeStore('acc-5');
    renderComp(store);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('explains block behavior to the user', () => {
    const store = makeStore('acc-5');
    renderComp(store);
    expect(screen.getByText(/hide all of their content/i)).toBeInTheDocument();
    expect(screen.getByText(/tied to their account.*alias/i)).toBeInTheDocument();
  });

  it('Cancel does NOT call blockUserThunk', () => {
    const store = makeStore('acc-5');
    renderComp(store);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockBlockUserThunk).not.toHaveBeenCalled();
  });

  it('Cancel closes the dialog', () => {
    const store = makeStore('acc-5');
    renderComp(store);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(store.getState().moderation.blockConfirmTarget).toBeNull();
  });

  it('Confirm calls blockUserThunk with target ID', async () => {
    const store = makeStore('acc-5');
    renderComp(store);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^block$/i }));
    });
    expect(mockBlockUserThunk).toHaveBeenCalledWith('acc-5');
  });

  it('Escape key closes without blocking', () => {
    const store = makeStore('acc-5');
    renderComp(store);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockBlockUserThunk).not.toHaveBeenCalled();
    expect(store.getState().moderation.blockConfirmTarget).toBeNull();
  });
});
