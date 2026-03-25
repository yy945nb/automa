import { useState } from 'react';
import WorkflowCard from './components/WorkflowCard';

const sampleWorkflows = [
  {
    id: '1',
    name: 'Open Website',
    description: 'Automatically opens a URL in a new tab',
    isActive: true,
  },
  {
    id: '2',
    name: 'Fill Form',
    description: 'Fills out a web form with predefined data',
    isActive: false,
  },
  {
    id: '3',
    name: 'Take Screenshot',
    description: 'Captures a screenshot of the current page',
    isActive: true,
  },
];

function App() {
  const [workflows, setWorkflows] = useState(sampleWorkflows);

  const handleToggle = (id) => {
    setWorkflows((prev) =>
      prev.map((wf) =>
        wf.id === id ? { ...wf, isActive: !wf.isActive } : wf
      )
    );
  };

  const activeCount = workflows.filter((wf) => wf.isActive).length;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Automa Workflows</h1>
        <span className="badge">
          {activeCount} / {workflows.length} active
        </span>
      </header>
      <main className="workflow-list">
        {workflows.map((workflow) => (
          <WorkflowCard
            key={workflow.id}
            workflow={workflow}
            onToggle={handleToggle}
          />
        ))}
      </main>
    </div>
  );
}

export default App;
