/**
 * PrivacySafeCount.test.tsx — Unit tests for PrivacySafeCount component.
 */
import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { PrivacySafeCount } from './PrivacySafeCount';
import { PRIVACY_THRESHOLD_MIN_GROUP_SIZE } from '../../constants/limits';

describe('PrivacySafeCount', () => {
  it('masks count below threshold', () => {
    render(<PrivacySafeCount count={50} />);
    expect(screen.getByText(`< ${PRIVACY_THRESHOLD_MIN_GROUP_SIZE}`)).toBeInTheDocument();
  });

  it('masks count of zero', () => {
    render(<PrivacySafeCount count={0} />);
    expect(screen.getByText(`< ${PRIVACY_THRESHOLD_MIN_GROUP_SIZE}`)).toBeInTheDocument();
  });

  it('shows formatted count at or above threshold', () => {
    render(<PrivacySafeCount count={250} />);
    expect(screen.getByText('250')).toBeInTheDocument();
  });

  it('shows formatted compact count for large numbers', () => {
    render(<PrivacySafeCount count={1500} />);
    expect(screen.getByText('1.5k')).toBeInTheDocument();
  });

  it('uses custom threshold', () => {
    render(<PrivacySafeCount count={5} threshold={10} />);
    expect(screen.getByText('< 10')).toBeInTheDocument();
  });

  it('has descriptive aria-label with label prop', () => {
    render(<PrivacySafeCount count={200} label="Same reactions" />);
    const el = screen.getByLabelText(/200 Same reactions/i);
    expect(el).toBeInTheDocument();
  });

  it('has approximate indicator in aria-label when masked', () => {
    render(<PrivacySafeCount count={5} label="Same reactions" />);
    const el = screen.getByLabelText(/approximate/i);
    expect(el).toBeInTheDocument();
  });
});
