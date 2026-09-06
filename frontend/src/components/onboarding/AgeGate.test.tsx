/**
 * AgeGate.test.tsx — Unit tests for the AgeGate component.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AgeGate from './AgeGate';

describe('AgeGate', () => {
  it('renders a checkbox', () => {
    render(<AgeGate confirmed={false} onChange={jest.fn()} />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('checkbox is unchecked when confirmed=false', () => {
    render(<AgeGate confirmed={false} onChange={jest.fn()} />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('checkbox is checked when confirmed=true', () => {
    render(<AgeGate confirmed={true} onChange={jest.fn()} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('calls onChange with true when checked', () => {
    const onChange = jest.fn();
    render(<AgeGate confirmed={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with false when unchecked', () => {
    const onChange = jest.fn();
    render(<AgeGate confirmed={true} onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('checkbox has aria-required="true"', () => {
    render(<AgeGate confirmed={false} onChange={jest.fn()} />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-required', 'true');
  });

  it('displays age confirmation text', () => {
    render(<AgeGate confirmed={false} onChange={jest.fn()} />);
    expect(screen.getByText(/16 years of age/)).toBeInTheDocument();
  });
});
