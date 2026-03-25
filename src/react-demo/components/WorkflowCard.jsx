function WorkflowCard({ workflow, onToggle }) {
  const { id, name, description, isActive } = workflow;

  return (
    <div className={`workflow-card ${isActive ? 'active' : 'inactive'}`}>
      <div className="workflow-info">
        <h3 className="workflow-name">{name}</h3>
        <p className="workflow-description">{description}</p>
      </div>
      <button
        type="button"
        className={`toggle-btn ${isActive ? 'toggle-on' : 'toggle-off'}`}
        onClick={() => onToggle(id)}
        aria-label={`${isActive ? 'Disable' : 'Enable'} workflow: ${name}`}
      >
        {isActive ? 'Enabled' : 'Disabled'}
      </button>
    </div>
  );
}

export default WorkflowCard;
