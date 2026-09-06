import React from 'react';
import { render, screen } from '@testing-library/react';
import AvatarSVG from './AvatarSVG';
import { AVATAR_SIZE_PX } from '../../utils/avatarUtils';

describe('AvatarSVG', () => {
  it('renders with role="img"', () => {
    render(<AvatarSVG seed="test-seed" aliasName="Blue Fox" />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('sets aria-label to the aliasName', () => {
    render(<AvatarSVG seed="test-seed" aliasName="Blue Fox" />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Blue Fox');
  });

  it('applies md size by default (40px)', () => {
    render(<AvatarSVG seed="test-seed" aliasName="Blue Fox" />);
    const el = screen.getByRole('img');
    expect(el).toHaveAttribute('style', expect.stringContaining(`width: ${AVATAR_SIZE_PX.md}px`));
  });

  it('applies sm size correctly', () => {
    render(<AvatarSVG seed="test-seed" aliasName="Blue Fox" size="sm" />);
    const el = screen.getByRole('img');
    expect(el).toHaveAttribute('style', expect.stringContaining(`width: ${AVATAR_SIZE_PX.sm}px`));
  });

  it('applies lg size correctly', () => {
    render(<AvatarSVG seed="test-seed" aliasName="Blue Fox" size="lg" />);
    const el = screen.getByRole('img');
    expect(el).toHaveAttribute('style', expect.stringContaining(`width: ${AVATAR_SIZE_PX.lg}px`));
  });

  it('contains SVG markup inside the container', () => {
    render(<AvatarSVG seed="test-seed" aliasName="Blue Fox" />);
    const el = screen.getByRole('img');
    expect(el.innerHTML).toContain('<svg');
  });

  it('two identical seeds produce identical SVG output', () => {
    const { rerender, getByRole: getByRoleFirst } = render(
      <AvatarSVG seed="same-seed" aliasName="A" />
    );
    const svgA = getByRoleFirst('img').innerHTML;

    rerender(<AvatarSVG seed="same-seed" aliasName="B" />);
    const svgB = getByRoleFirst('img').innerHTML;
    expect(svgA).toBe(svgB);
  });

  it('different seeds produce different SVG output', () => {
    const { rerender, getByRole } = render(<AvatarSVG seed="seed-a" aliasName="A" />);
    const svgA = getByRole('img').innerHTML;

    rerender(<AvatarSVG seed="seed-b" aliasName="B" />);
    const svgB = getByRole('img').innerHTML;
    expect(svgA).not.toBe(svgB);
  });

  it('applies custom className', () => {
    render(<AvatarSVG seed="test-seed" aliasName="Blue Fox" className="my-avatar" />);
    expect(screen.getByRole('img').className).toContain('my-avatar');
  });
});
