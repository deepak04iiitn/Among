/**
 * IntentSelector.test.tsx — Unit tests for the IntentSelector component.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import IntentSelector from './IntentSelector';

describe('IntentSelector', () => {
  const onSelect = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it('renders all 4 intent options', () => {
    render(<IntentSelector onSelect={onSelect} />);
    expect(screen.getByText('Share something')).toBeInTheDocument();
    expect(screen.getByText('Find others')).toBeInTheDocument();
    expect(screen.getByText('Help someone')).toBeInTheDocument();
    expect(screen.getByText('Just explore')).toBeInTheDocument();
  });

  it('renders each intent description', () => {
    render(<IntentSelector onSelect={onSelect} />);
    expect(screen.getByText(/something I need to say/)).toBeInTheDocument();
    expect(screen.getByText(/not alone/)).toBeInTheDocument();
  });

  it('calls onSelect with the intent id when an option is clicked', () => {
    jest.useFakeTimers();
    render(<IntentSelector onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Share something').closest('button')!);
    jest.advanceTimersByTime(200);
    expect(onSelect).toHaveBeenCalledWith('share');
    jest.useRealTimers();
  });

  it('calls onSelect with correct id for each intent', () => {
    jest.useFakeTimers();
    const intents = [
      { label: 'Share something', id: 'share' },
      { label: 'Find others',     id: 'find' },
      { label: 'Help someone',    id: 'help' },
      { label: 'Just explore',    id: 'explore' },
    ];

    for (const intent of intents) {
      const { unmount } = render(<IntentSelector onSelect={onSelect} />);
      fireEvent.click(screen.getByText(intent.label).closest('button')!);
      jest.advanceTimersByTime(200);
      expect(onSelect).toHaveBeenLastCalledWith(intent.id);
      unmount();
    }
    jest.useRealTimers();
  });

  it('all options are rendered as accessible buttons with aria-pressed', () => {
    render(<IntentSelector onSelect={onSelect} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
    buttons.forEach((btn) => {
      expect(btn).toHaveAttribute('aria-pressed');
    });
  });

  it('shows a navigation hint when an intent is selected', () => {
    jest.useFakeTimers();
    render(<IntentSelector onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Share something').closest('button')!);
    expect(screen.getByText(/Continue to select your interests/)).toBeInTheDocument();
    jest.useRealTimers();
  });
});
