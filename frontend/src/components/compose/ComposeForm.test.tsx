/**
 * ComposeForm.test.tsx — Unit tests for the compose form.
 *
 * Tests:
 *  - Character count updates in real time (visible near limit)
 *  - Submit blocked when < POST_MIN_CHARS
 *  - Submit blocked when > POST_MAX_CHARS
 *  - Category validation: requires 1 (except exploratory mode)
 *  - Safety reminder shown on first submit (sessionStorage not set)
 *  - Safety reminder NOT shown on second submit (after it has been seen)
 *  - Form values passed correctly to onSubmit
 *  - Visibility scope selection
 *  - Error message displayed
 */
import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComposeForm } from './ComposeForm';
import { POST_MIN_CHARS, POST_MAX_CHARS, COMPOSE_COUNTER_VISIBLE_THRESHOLD } from '../../constants/limits';

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock SafetyReminder to short-circuit the 3s wait in form tests
jest.mock('./SafetyReminder', () => ({
  SafetyReminder: ({ onConfirm, onDismiss }: { onConfirm: () => void; onDismiss: () => void }) => (
    <div role="dialog" aria-modal="true">
      <button onClick={onConfirm}>I understand</button>
      <button onClick={onDismiss}>Go back</button>
    </div>
  ),
  hasSafetyReminderBeenSeen: jest.fn(() => false),
}));

// Mock child components that have their own tests
jest.mock('./ComposeArea', () => ({
  __esModule: true,
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea
      aria-label="Write your experience"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      data-testid="compose-textarea"
    />
  ),
}));

jest.mock('./CategorySelector', () => ({
  __esModule: true,
  default: ({ selectedIds, onChange }: { selectedIds: string[]; onChange: (ids: string[]) => void }) => (
    <div>
      <button
        type="button"
        onClick={() => onChange([...selectedIds, 'loneliness'])}
        data-testid="add-category"
      >
        Add category
      </button>
      <span data-testid="category-count">{selectedIds.length}</span>
    </div>
  ),
}));

jest.mock('./StateSelector', () => ({
  __esModule: true,
  default: ({ onChange }: { onChange: (s: string) => void }) => (
    <button type="button" data-testid="state-selector" onClick={() => onChange('past')}>
      Change state
    </button>
  ),
}));

import * as SafetyReminderModule from './SafetyReminder';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderForm(props: Partial<React.ComponentProps<typeof ComposeForm>> = {}) {
  const onSubmit = jest.fn();
  const result = render(<ComposeForm onSubmit={onSubmit} {...props} />);
  return { onSubmit, ...result };
}

const VALID_BODY = 'x'.repeat(POST_MIN_CHARS + 10);
const SHORT_BODY = 'x'.repeat(POST_MIN_CHARS - 1);
const LONG_BODY  = 'x'.repeat(POST_MAX_CHARS + 1);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ComposeForm — character counter', () => {
  it('does NOT show counter when far from the limit', () => {
    renderForm();
    // Default is empty — counter should not be visible
    expect(screen.queryByLabelText(/characters remaining/i)).not.toBeInTheDocument();
  });

  it('shows counter when within COMPOSE_COUNTER_VISIBLE_THRESHOLD of limit', async () => {
    const { getByTestId } = renderForm();
    const textarea = getByTestId('compose-textarea');
    const nearLimitText = 'x'.repeat(POST_MAX_CHARS - COMPOSE_COUNTER_VISIBLE_THRESHOLD + 10);

    // Use fireEvent.change (not userEvent.type) for large strings to avoid timeout
    fireEvent.change(textarea, { target: { value: nearLimitText } });

    await waitFor(() => {
      expect(screen.getByLabelText(/characters remaining/i)).toBeInTheDocument();
    });
  });
});

describe('ComposeForm — submit validation', () => {
  it('submit button is disabled when body is too short', async () => {
    const { getByTestId } = renderForm();
    const textarea = getByTestId('compose-textarea');

    fireEvent.change(textarea, { target: { value: SHORT_BODY } });

    // Add a category to pass category validation
    fireEvent.click(screen.getByTestId('add-category'));

    const submitBtn = screen.getByRole('button', { name: /share anonymously/i });
    expect(submitBtn).toBeDisabled();
  });

  it('shows hint text when body is between 1 and MIN_CHARS', async () => {
    const { getByTestId } = renderForm();
    const textarea = getByTestId('compose-textarea');

    fireEvent.change(textarea, { target: { value: 'abc' } });

    await waitFor(() => {
      expect(screen.getByText(/more characters to go/i)).toBeInTheDocument();
    });
  });

  it('submit button is disabled when body exceeds POST_MAX_CHARS', async () => {
    const { getByTestId } = renderForm();
    const textarea = getByTestId('compose-textarea');

    fireEvent.change(textarea, { target: { value: LONG_BODY } });
    fireEvent.click(screen.getByTestId('add-category'));

    const submitBtn = screen.getByRole('button', { name: /share anonymously/i });
    expect(submitBtn).toBeDisabled();
  });

  it('requires at least 1 category in default mode', async () => {
    const { getByTestId, onSubmit } = renderForm();
    const textarea = getByTestId('compose-textarea');

    fireEvent.change(textarea, { target: { value: VALID_BODY } });

    // Do NOT add a category

    const submitBtn = screen.getByRole('button', { name: /share anonymously/i });
    expect(submitBtn).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('ComposeForm — safety reminder gate', () => {
  beforeEach(() => {
    // Simulate first-time user (no sessionStorage flag)
    (SafetyReminderModule.hasSafetyReminderBeenSeen as jest.Mock).mockReturnValue(false);
  });

  it('shows safety reminder on first submit', async () => {
    const { getByTestId } = renderForm();
    const textarea = getByTestId('compose-textarea');

    fireEvent.change(textarea, { target: { value: VALID_BODY } });
    fireEvent.click(screen.getByTestId('add-category'));

    const submitBtn = screen.getByRole('button', { name: /share anonymously/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('calls onSubmit after confirming safety reminder', async () => {
    const { getByTestId, onSubmit } = renderForm();
    const textarea = getByTestId('compose-textarea');

    fireEvent.change(textarea, { target: { value: VALID_BODY } });
    fireEvent.click(screen.getByTestId('add-category'));
    fireEvent.click(screen.getByRole('button', { name: /share anonymously/i }));

    await waitFor(() => screen.getByRole('dialog'));
    fireEvent.click(screen.getByText('I understand'));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ body: VALID_BODY })
    );
  });

  it('does NOT show reminder when already seen', async () => {
    (SafetyReminderModule.hasSafetyReminderBeenSeen as jest.Mock).mockReturnValue(true);

    const { getByTestId, onSubmit } = renderForm();
    const textarea = getByTestId('compose-textarea');

    fireEvent.change(textarea, { target: { value: VALID_BODY } });
    fireEvent.click(screen.getByTestId('add-category'));
    fireEvent.click(screen.getByRole('button', { name: /share anonymously/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalled();
  });
});

describe('ComposeForm — error display', () => {
  it('renders external error message', () => {
    renderForm({ error: 'Something went wrong' });
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  });
});

describe('ComposeForm — form values', () => {
  it('passes correct values to onSubmit callback', async () => {
    (SafetyReminderModule.hasSafetyReminderBeenSeen as jest.Mock).mockReturnValue(true);

    const { getByTestId, onSubmit } = renderForm();
    const textarea = getByTestId('compose-textarea');

    fireEvent.change(textarea, { target: { value: VALID_BODY } });
    fireEvent.click(screen.getByTestId('add-category'));

    fireEvent.click(screen.getByRole('button', { name: /share anonymously/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      body:            VALID_BODY,
      categoryIds:     ['loneliness'],
      state:           'current',
      visibilityScope: 'broad',
    });
  });
});
