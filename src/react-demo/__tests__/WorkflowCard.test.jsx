import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import WorkflowCard from '../components/WorkflowCard';

const mockWorkflow = {
  id: '1',
  name: 'Test Workflow',
  description: 'A workflow for testing',
  isActive: true,
};

describe('WorkflowCard', () => {
  it('renders workflow name and description', () => {
    render(<WorkflowCard workflow={mockWorkflow} onToggle={() => {}} />);

    expect(screen.getByText('Test Workflow')).toBeInTheDocument();
    expect(screen.getByText('A workflow for testing')).toBeInTheDocument();
  });

  it('shows "Enabled" label when workflow is active', () => {
    render(<WorkflowCard workflow={mockWorkflow} onToggle={() => {}} />);

    expect(screen.getByRole('button')).toHaveTextContent('Enabled');
  });

  it('shows "Disabled" label when workflow is inactive', () => {
    const inactiveWorkflow = { ...mockWorkflow, isActive: false };
    render(<WorkflowCard workflow={inactiveWorkflow} onToggle={() => {}} />);

    expect(screen.getByRole('button')).toHaveTextContent('Disabled');
  });

  it('applies "active" class when workflow is active', () => {
    const { container } = render(
      <WorkflowCard workflow={mockWorkflow} onToggle={() => {}} />
    );

    expect(container.firstChild).toHaveClass('active');
  });

  it('applies "inactive" class when workflow is inactive', () => {
    const inactiveWorkflow = { ...mockWorkflow, isActive: false };
    const { container } = render(
      <WorkflowCard workflow={inactiveWorkflow} onToggle={() => {}} />
    );

    expect(container.firstChild).toHaveClass('inactive');
  });

  it('calls onToggle with workflow id when button is clicked', () => {
    const mockToggle = vi.fn();
    render(<WorkflowCard workflow={mockWorkflow} onToggle={mockToggle} />);

    fireEvent.click(screen.getByRole('button'));

    expect(mockToggle).toHaveBeenCalledWith('1');
  });
});
