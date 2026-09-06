/**
 * PromptCard.test.tsx — Unit tests for the PromptCard component.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PromptCard from './PromptCard';
import snyReducer from '../../features/someoneNeedsYou/snySlice';
import featureFlagsReducer, { flagOverridden } from '../../features/featureFlags/featureFlagsSlice';
import * as snyApi from '../../lib/snyApi';

jest.mock('../../lib/snyApi');

const mockGetDailyPrompt = snyApi.getDailyPrompt as jest.Mock;
const mockAcceptPrompt   = snyApi.acceptPrompt   as jest.Mock;

const SAMPLE_PROMPT = {
  postId:         'post-1',
  categoryId:     'loneliness',
  bodyPreview:    "I can't stop thinking about it.",
  skipsUsed:      0,
  skipsRemaining: 3,
};

function makeStore() {
  const store = configureStore({
    reducer: {
      sny:          snyReducer,
      featureFlags: featureFlagsReducer,
    },
  });
  return store;
}

function enableFlag(store: ReturnType<typeof makeStore>): void {
  store.dispatch(flagOverridden({ flag: 'someoneNeedsYou', enabled: true }));
}

beforeEach(() => jest.resetAllMocks());

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PromptCard', () => {
  it('renders nothing when someoneNeedsYou flag is off', async () => {
    mockGetDailyPrompt.mockResolvedValue(null);
    const store = makeStore();
    // Flag remains false (default)
    const { container } = render(
      <Provider store={store}>
        <PromptCard />
      </Provider>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when flag is on but no prompt available', async () => {
    mockGetDailyPrompt.mockResolvedValue(null);
    const store = makeStore();
    enableFlag(store);

    await act(async () => {
      render(
        <Provider store={store}>
          <PromptCard />
        </Provider>
      );
    });

    expect(screen.queryByRole('region')).toBeNull();
  });

  it('renders the prompt card when flag is on and prompt is available', async () => {
    mockGetDailyPrompt.mockResolvedValue(SAMPLE_PROMPT);
    const store = makeStore();
    enableFlag(store);

    await act(async () => {
      render(
        <Provider store={store}>
          <PromptCard />
        </Provider>
      );
    });

    await waitFor(() => {
      expect(screen.getByRole('region', { name: /someone needs you today/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/Someone needs you today/i)).toBeInTheDocument();
    expect(screen.getByText(/I can't stop thinking about it/i)).toBeInTheDocument();
  });

  it('does not show the original author alias', async () => {
    mockGetDailyPrompt.mockResolvedValue(SAMPLE_PROMPT);
    const store = makeStore();
    enableFlag(store);

    await act(async () => {
      render(
        <Provider store={store}>
          <PromptCard />
        </Provider>
      );
    });

    await waitFor(() => {
      expect(screen.queryByText(/@\w+/)).toBeNull();
    });
  });

  it('calls acceptPromptThunk and fires onAccepted when "I want to help" is clicked', async () => {
    mockGetDailyPrompt.mockResolvedValue(SAMPLE_PROMPT);
    mockAcceptPrompt.mockResolvedValueOnce({ contextCategoryId: 'loneliness', contextPostId: 'post-1' });

    const onAccepted = jest.fn();
    const store = makeStore();
    enableFlag(store);

    await act(async () => {
      render(
        <Provider store={store}>
          <PromptCard onAccepted={onAccepted} />
        </Provider>
      );
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /connect with this person/i })).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /connect with this person/i }));
    });

    await waitFor(() => {
      expect(mockAcceptPrompt).toHaveBeenCalledWith('post-1');
      expect(onAccepted).toHaveBeenCalledWith('loneliness', 'post-1');
    });
  });

  it('shows the category display name', async () => {
    mockGetDailyPrompt.mockResolvedValue(SAMPLE_PROMPT);
    const store = makeStore();
    enableFlag(store);

    await act(async () => {
      render(
        <Provider store={store}>
          <PromptCard />
        </Provider>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Loneliness')).toBeInTheDocument();
    });
  });
});
