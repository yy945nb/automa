import React from 'react';

interface WorkflowEditorProps {
  id?: string;
  disabled?: boolean;
  minimap?: boolean;
  editorControls?: boolean;
  children?: React.ReactNode;
}

export default function WorkflowEditor({ id, disabled = false, minimap = true, editorControls = true, children }: WorkflowEditorProps) {
  // TODO: Integrate @vue-flow/core or reactflow for the node-based workflow editor
  // This is the most complex component — requires a full flow/graph library integration
  return (
    <div id={id} className="workflow-editor relative h-full w-full bg-gray-50 dark:bg-gray-900">
      <div className="flex h-full items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-lg font-semibold">Workflow Editor</p>
          <p className="mt-2 text-sm">TODO: Integrate reactflow/xyflow graph editor</p>
          <p className="mt-1 text-xs text-gray-300">Previously vue-flow based</p>
        </div>
      </div>
      {editorControls && (
        <div className="absolute bottom-0 left-0 z-10 flex w-full items-center p-4">
          {children}
        </div>
      )}
    </div>
  );
}
