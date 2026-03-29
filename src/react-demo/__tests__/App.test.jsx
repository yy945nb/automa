import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App', () => {
  it('renders the app title', () => {
    render(<App />);

    expect(screen.getByText('Automa Workflows')).toBeInTheDocument();
  });

  it('renders all sample workflows', () => {
    render(<App />);

    expect(screen.getByText('Open Website')).toBeInTheDocument();
    expect(screen.getByText('Fill Form')).toBeInTheDocument();
    expect(screen.getByText('Take Screenshot')).toBeInTheDocument();
  });

  it('shows correct active count badge', () => {
    render(<App />);

    expect(screen.getByText('2 / 3 active')).toBeInTheDocument();
  });

  it('toggles workflow state and updates badge count', () => {
    render(<App />);

    const fillFormCard = screen.getByText('Fill Form').closest('.workflow-card');
    const toggleBtn = fillFormCard.querySelector('button');

    expect(toggleBtn).toHaveTextContent('Disabled');
    expect(screen.getByText('2 / 3 active')).toBeInTheDocument();

    fireEvent.click(toggleBtn);

    expect(toggleBtn).toHaveTextContent('Enabled');
    expect(screen.getByText('3 / 3 active')).toBeInTheDocument();
  });

  it('renders workflow cards with correct initial states', () => {
    render(<App />);

    const buttons = screen.getAllByRole('button');
    const enabledButtons = buttons.filter((btn) => btn.textContent === 'Enabled');
    const disabledButtons = buttons.filter((btn) => btn.textContent === 'Disabled');

    expect(enabledButtons).toHaveLength(2);
    expect(disabledButtons).toHaveLength(1);
  });
});
