/**
 * SkipControls.test.tsx — Unit tests for SkipControls component.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import SkipControls from './SkipControls';
import snyReducer from '../../features/someoneNeedsYou/snySlice';
import * as snyApi from '../../lib/snyApi';

jest.mock('../../lib/snyApi');

const mockSkipPrompt   = snyApi.skipPrompt   as jest.Mock;
const mockDismissPrompt = snyApi.dismissPrompt as jest.Mock;

function makeStore() {
  return configureStore({ reducer: { sny: snyReducer } });
}

beforeEach(() => jest.resetAllMocks());

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SkipControls', () => {
  it('shows "See another" when skips are available', () => {
    const store = makeStore();
    render(
      <Provider store={store}>
        <SkipControls currentPostId="post-1" skipsUsed={0} />
      </Provider>
    );
    expect(screen.getByRole('button', { name: /see another experience/i })).toBeInTheDocument();
  });

  it('does NOT show "See another" when skip limit is reached', () => {
    const store = makeStore();
    render(
      <Provider store={store}>
        <SkipControls currentPostId="post-1" skipsUsed={3} />
      </Provider>
    );
    expect(screen.queryByRole('button', { name: /see another/i })).toBeNull();
    expect(screen.getByText(/No more suggestions/i)).toBeInTheDocument();
  });

  it('shows skip counter when skipsUsed > 0', () => {
    const store = makeStore();
    render(
      <Provider store={store}>
        <SkipControls currentPostId="post-1" skipsUsed={2} />
      </Provider>
    );
    expect(screen.getByLabelText(/2 of 3 skips used/i)).toBeInTheDocument();
  });

  it('calls skip thunk when "See another" is clicked', async () => {
    mockSkipPrompt.mockResolvedValueOnce(null);
    const store = makeStore();
    render(
      <Provider store={store}>
        <SkipControls currentPostId="post-1" skipsUsed={1} />
      </Provider>
    );
    fireEvent.click(screen.getByRole('button', { name: /see another/i }));
    // After a tick
    await new Promise((r) => setTimeout(r, 10));
    expect(mockSkipPrompt).toHaveBeenCalledWith('post-1');
  });

  it('calls dismiss thunk when "Not today" is clicked', async () => {
    mockDismissPrompt.mockResolvedValueOnce(undefined);
    const store = makeStore();
    render(
      <Provider store={store}>
        <SkipControls currentPostId="post-1" skipsUsed={0} />
      </Provider>
    );
    fireEvent.click(screen.getByRole('button', { name: /dismiss for today/i }));
    await new Promise((r) => setTimeout(r, 10));
    expect(mockDismissPrompt).toHaveBeenCalled();
  });
});
