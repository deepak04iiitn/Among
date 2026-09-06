/**
 * SameButton.test.tsx — Unit tests for SameButton.
 */
import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SameButton } from './SameButton';

const POST_ID = 'post-123';

function renderButton(props: Partial<React.ComponentProps<typeof SameButton>> = {}) {
  const onToggle = jest.fn();
  const result   = render(
    <SameButton
      postId={POST_ID}
      count={0}
      isActive={false}
      onToggle={onToggle}
      {...props}
    />
  );
  return { onToggle, ...result };
}

describe('SameButton', () => {
  it('renders with SAME label', () => {
    renderButton();
    expect(screen.getByText('SAME')).toBeInTheDocument();
  });

  it('has descriptive aria-label', () => {
    renderButton({ count: 5, isActive: false });
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-label')).toMatch(/say same/i);
  });

  it('aria-label changes when active', () => {
    renderButton({ count: 5, isActive: true });
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-label')).toMatch(/remove same/i);
  });

  it('shows count when count > 0', () => {
    renderButton({ count: 42 });
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('does not show count when count is 0', () => {
    const { container } = renderButton({ count: 0 });
    // The count span should not exist
    expect(container.querySelector('.tabular-nums')).toBeNull();
  });

  it('calls onToggle when clicked', () => {
    const { onToggle } = renderButton();
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('is disabled when loading', () => {
    renderButton({ loading: true });
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('has aria-pressed reflecting active state', () => {
    renderButton({ isActive: true });
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('meets minimum touch target size (44px)', () => {
    renderButton();
    const btn = screen.getByRole('button');
    expect(btn.className).toMatch(/min-h-\[44px\]/);
  });
});
