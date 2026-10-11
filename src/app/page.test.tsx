import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { StatusBadge } from '@/components/ui/Badge';

describe('UI Components Smoke Tests', () => {
  it('renders status badges with appropriate styles', () => {
    render(<StatusBadge status="MEETS" type="mandatory" />);
    expect(screen.getByText('MEETS')).toBeInTheDocument();

    render(<StatusBadge status="SHORTLISTED" type="decision" />);
    expect(screen.getByText('SHORTLISTED')).toBeInTheDocument();
  });
});
