/**
 * SafetyReminder.test.tsx — Unit tests for the safety reminder modal.
 *
 * Tests:
 *  - Renders with required content
 *  - Confirm button is disabled for 3 seconds (enforced read time)
 *  - After 3 seconds, confirm button becomes active
 *  - onConfirm called when confirmed
 *  - onDismiss called when "Go back" pressed
 *  - hasSafetyReminderBeenSeen returns false initially, true after confirmation
 *  - Accessible attributes
 */
import * as React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { SafetyReminder, hasSafetyReminderBeenSeen } from './SafetyReminder';

// ─── Session storage mock ─────────────────────────────────────────────────────

const mockSessionStorage: Record<string, string> = {};

beforeAll(() => {
  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: (key: string) => mockSessionStorage[key] ?? null,
      setItem: (key: string, val: string) => { mockSessionStorage[key] = val; },
      removeItem: (key: string) => { delete mockSessionStorage[key]; },
      clear: () => { Object.keys(mockSessionStorage).forEach((k) => delete mockSessionStorage[k]); },
    },
    writable: true,
  });
});

beforeEach(() => {
  Object.keys(mockSessionStorage).forEach((k) => delete mockSessionStorage[k]);
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SafetyReminder', () => {
  it('renders the safety reminder with key content', () => {
    render(
      <SafetyReminder onConfirm={jest.fn()} onDismiss={jest.fn()} />
    );

    expect(screen.getByText(/before you share/i)).toBeInTheDocument();
    expect(screen.getByText(/don.*t include/i)).toBeInTheDocument();
  });

  it('confirm button is disabled initially (3s minimum read time)', () => {
    render(
      <SafetyReminder onConfirm={jest.fn()} onDismiss={jest.fn()} />
    );

    const confirmBtn = screen.getByText(/please read/i);
    expect(confirmBtn.closest('button')).toBeDisabled();
  });

  it('confirm button becomes active after 3 seconds', async () => {
    render(
      <SafetyReminder onConfirm={jest.fn()} onDismiss={jest.fn()} />
    );

    act(() => {
      jest.advanceTimersByTime(3100);
    });

    await waitFor(() => {
      expect(screen.getByText(/I understand/i)).toBeInTheDocument();
    });

    const confirmBtn = screen.getByText(/I understand/i).closest('button');
    expect(confirmBtn).not.toBeDisabled();
  });

  it('calls onConfirm when user confirms after 3s', async () => {
    const onConfirm = jest.fn();
    render(
      <SafetyReminder onConfirm={onConfirm} onDismiss={jest.fn()} />
    );

    act(() => { jest.advanceTimersByTime(3100); });

    await waitFor(() => {
      expect(screen.getByText(/I understand/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/I understand/i).closest('button')!);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when user clicks Go back', () => {
    const onDismiss = jest.fn();
    render(
      <SafetyReminder onConfirm={jest.fn()} onDismiss={onDismiss} />
    );

    fireEvent.click(screen.getByText(/go back/i));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('has correct aria-modal and role attributes', () => {
    render(
      <SafetyReminder onConfirm={jest.fn()} onDismiss={jest.fn()} />
    );

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('hasSafetyReminderBeenSeen returns false initially', () => {
    expect(hasSafetyReminderBeenSeen()).toBe(false);
  });

  it('hasSafetyReminderBeenSeen returns true after confirmation', async () => {
    const onConfirm = jest.fn();
    render(
      <SafetyReminder onConfirm={onConfirm} onDismiss={jest.fn()} />
    );

    act(() => { jest.advanceTimersByTime(3100); });

    await waitFor(() => {
      expect(screen.getByText(/I understand/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/I understand/i).closest('button')!);
    expect(hasSafetyReminderBeenSeen()).toBe(true);
  });
});
