import React, { useState } from 'react';
// TODO: import real task handlers and EditForm components
// import { tasks } from '@/utils/shared';
// import EditForms from '@/components/newtab/workflow/edit/EditForms';
// import EditTriggerEvent from '@/components/newtab/workflow/edit/EditTriggerEvent';
// import EditScrollElement from '@/components/newtab/workflow/edit/EditScrollElement';
// import handleForms from '@/content/blocksHandler/handlerForms';
// import handleGetText from '@/content/blocksHandler/handlerGetText';
// import handleEventClick from '@/content/blocksHandler/handlerEventClick';
// import handelTriggerEvent from '@/content/blocksHandler/handlerTriggerEvent';
// import handleElementScroll from '@/content/blocksHandler/handlerElementScroll';

interface BlockDefinition {
  name: string;
  component?: React.ComponentType<any> | '';
  handler: (params: { data: Record<string, any> }) => Promise<any>;
}

// TODO: populate with real tasks and handlers
const blocks: Record<string, BlockDefinition> = {
  forms: {
    name: 'Forms',
    component: undefined,
    handler: async (_p) => { console.warn('TODO: handleForms'); return {}; },
  },
  'get-text': {
    name: 'Get text',
    component: undefined,
    handler: async (_p) => { console.warn('TODO: handleGetText'); return {}; },
  },
  'event-click': {
    name: 'Event click',
    component: undefined,
    handler: async (_p) => { console.warn('TODO: handleEventClick'); return {}; },
  },
  'trigger-event': {
    name: 'Trigger event',
    component: undefined,
    handler: async (_p) => { console.warn('TODO: handelTriggerEvent'); return {}; },
  },
  'element-scroll': {
    name: 'Element scroll',
    component: undefined,
    handler: async (_p) => { console.warn('TODO: handleElementScroll'); return {}; },
  },
};

interface SelectorBlocksProps {
  selector?: string;
  elements?: any[];
  onUpdate?: () => void;
  onExecute?: (isExecuting: boolean) => void;
}

const SelectorBlocks: React.FC<SelectorBlocksProps> = ({
  selector = '',
  elements = [],
  onUpdate,
  onExecute,
}) => {
  const [selectedBlock, setSelectedBlock] = useState('');
  const [params, setParams] = useState<Record<string, any>>({});
  const [blockResult, setBlockResult] = useState('');

  function updateParams(data: Record<string, any> = {}) {
    setParams(data);
    onUpdate?.();
  }

  function onSelectChanged(value: string) {
    // TODO: use tasks[value].data for defaults
    setParams({});
    setBlockResult('');
    setSelectedBlock(value);
    onUpdate?.();
  }

  function executeBlock() {
    if (!selectedBlock) return;

    const execParams = {
      ...params,
      selector,
      multiple: elements.length > 1,
    };

    onExecute?.(true);

    blocks[selectedBlock].handler({ data: execParams }).then((result) => {
      setBlockResult(JSON.stringify(result, null, 2).trim());
      onUpdate?.();
      onExecute?.(false);
    });
  }

  const BlockComponent = selectedBlock && blocks[selectedBlock]?.component;

  return (
    <div className="events mt-4">
      <div className="flex items-center">
        <select
          value={selectedBlock}
          className="mr-4 flex-1 p-0.5"
          onChange={(e) => onSelectChanged(e.target.value)}
        >
          <option value="" disabled>
            Select block
          </option>
          {Object.entries(blocks).map(([blockId, block]) => (
            <option key={blockId} value={blockId}>
              {block.name}
            </option>
          ))}
        </select>
        <button
          disabled={!selectedBlock}
          className="rounded-lg bg-accent px-3 py-2 text-white disabled:opacity-50"
          onClick={executeBlock}
        >
          Execute
        </button>
      </div>
      {BlockComponent && (
        <BlockComponent
          data={params}
          hideBase={true}
          onUpdateData={updateParams}
        />
      )}
      {blockResult && (
        <pre className="mt-2 h-full overflow-auto rounded-lg bg-accent p-2 text-sm text-gray-100">
          {blockResult}
        </pre>
      )}
    </div>
  );
};

export default SelectorBlocks;
