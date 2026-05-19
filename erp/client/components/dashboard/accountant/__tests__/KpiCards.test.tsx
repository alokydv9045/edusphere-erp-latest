import React from 'react';
import { render, screen } from '@testing-library/react';
import { KpiCards } from '../KpiCards';

describe('KpiCards Component', () => {
  const mockSummary = {
    todayCollection: 150000,
    yearCollection: 12500000,
    pendingAmount: 500000,
    txToday: 45
  };

  it('renders all four KPI cards', () => {
    render(<KpiCards summary={mockSummary} />);
    
    expect(screen.getByText("Today's Collection")).toBeInTheDocument();
    expect(screen.getByText("Year-to-Date")).toBeInTheDocument();
    expect(screen.getByText("Pending Amount")).toBeInTheDocument();
    expect(screen.getByText("Transactions Today")).toBeInTheDocument();
  });

  it('formats currency values correctly using formatINR', () => {
    render(<KpiCards summary={mockSummary} />);
    
    // 150000 should be 1.5L
    expect(screen.getByText('₹1.5L')).toBeInTheDocument();
    
    // 12500000 should be 125.0L
    expect(screen.getByText('₹125.0L')).toBeInTheDocument();
    
    // 500000 should be 5.0L
    expect(screen.getByText('₹5.0L')).toBeInTheDocument();
  });

  it('renders transaction count correctly', () => {
    render(<KpiCards summary={mockSummary} />);
    
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('45 transactions today')).toBeInTheDocument();
  });
});
