import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AliasReveal from './AliasReveal';

// Mock AvatarSVG so we don't need the full SVG logic
jest.mock('../common/AvatarSVG', () => {
  const MockAvatarSVG = ({ aliasName }: { aliasName: string }) => (
    <svg aria-label={aliasName} role="img" />
  );
  MockAvatarSVG.displayName = 'MockAvatarSVG';
  return MockAvatarSVG;
});

const defaultProps = {
  aliasName:  'Blue Fox',
  avatarSeed: 'seed-abc',
  onDismiss:  jest.fn(),
  isVisible:  true,
};

describe('AliasReveal', () => {
  beforeEach(() => jest.clearAllMocks());

  // ─── Rendering ─────────────────────────────────────────────────────────

  it('renders when isVisible is true', () => {
    render(<AliasReveal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render when isVisible is false', () => {
    render(<AliasReveal {...defaultProps} isVisible={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('displays the alias name in a heading', () => {
    render(<AliasReveal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Blue Fox' })).toBeInTheDocument();
  });

  it('displays the avatar', () => {
    render(<AliasReveal {...defaultProps} />);
    expect(screen.getByRole('img', { name: 'Blue Fox' })).toBeInTheDocument();
  });

  it('shows the "Begin →" dismiss button', () => {
    render(<AliasReveal {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Begin/i })).toBeInTheDocument();
  });

  it('shows contextual copy', () => {
    render(<AliasReveal {...defaultProps} />);
    expect(screen.getByText(/Your identity, for now/i)).toBeInTheDocument();
    expect(screen.getByText(/No one knows it/i)).toBeInTheDocument();
  });

  // ─── Accessibility ──────────────────────────────────────────────────────

  it('has aria-modal="true"', () => {
    render(<AliasReveal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('has aria-labelledby pointing to alias heading', () => {
    render(<AliasReveal {...defaultProps} />);
    const dialog  = screen.getByRole('dialog');
    const labelId = dialog.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    const heading = document.getElementById(labelId as string);
    expect(heading?.textContent).toBe('Blue Fox');
  });

  // ─── Dismiss behaviour ─────────────────────────────────────────────────

  it('calls onDismiss when Begin button is clicked', () => {
    render(<AliasReveal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Begin/i }));
    expect(defaultProps.onDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when Escape key is pressed', () => {
    render(<AliasReveal {...defaultProps} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(defaultProps.onDismiss).toHaveBeenCalledTimes(1);
  });

  // ─── Dark background ───────────────────────────────────────────────────

  it('has dark (bg-text) background — the only time bg is not white', () => {
    render(<AliasReveal {...defaultProps} />);
    // The overlay should have the dark bg class
    const overlay = screen.getByRole('dialog');
    expect(overlay.className).toContain('bg-[var(--color-text)]');
  });

  it('alias name is white text', () => {
    render(<AliasReveal {...defaultProps} />);
    const heading = screen.getByRole('heading', { name: 'Blue Fox' });
    expect(heading.className).toContain('text-white');
  });
});
