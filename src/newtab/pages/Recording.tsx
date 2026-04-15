import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import defu from 'defu';
import browser from 'webextension-polyfill';
import { tasks } from '@/utils/shared';
import { useWorkflowStore } from '@/stores/workflow';
import RecordWorkflowUtils from '@/newtab/utils/RecordWorkflowUtils';

interface FlowItem {
  id: string;
  data: Record<string, any>;
  description?: string;
  groupId?: string;
}

interface RecordingState {
  name: string;
  description?: string;
  flows: FlowItem[];
  activeTab: Record<string, any>;
  isGenerating: boolean;
  workflowId?: string;
  connectFrom?: { id: string; output?: string };
}

const Recording: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const workflowStore = useWorkflowStore();

  const [state, setState] = useState<RecordingState>({
    name: '',
    flows: [],
    activeTab: {},
    isGenerating: false,
  });
  const stateRef = useRef(state);
  stateRef.current = state;

  // ── drawflow generation ──────────────────────────────────
  const generateDrawflow = useCallback(
    (startBlock?: any, startBlockData?: any) => {
      let nextNodeId = nanoid();
      const triggerId = startBlock?.id || nanoid();
      let prevNodeId = startBlock?.id || triggerId;

      const nodes: any[] = [];
      const edges: any[] = [];

      const addEdge = (data: any = {}) => {
        edges.push({
          ...data,
          id: nanoid(),
          class: `source-${data.sourceHandle} targte-${data.targetHandle}`,
        });
      };

      addEdge({
        source: prevNodeId,
        target: nextNodeId,
        targetHandle: `${nextNodeId}-input-1`,
        sourceHandle: startBlock?.output || `${prevNodeId}-output-1`,
      });

      if (!startBlock) {
        nodes.push({
          position: { x: 50, y: 300 },
          id: triggerId,
          label: 'trigger',
          type: 'BlockBasic',
          data: (tasks as any).trigger.data,
        });
      }

      const position = {
        y: startBlockData ? startBlockData.position.y + 120 : 300,
        x: startBlockData ? startBlockData.position.x + 280 : 320,
      };
      const groups: Record<string, any[]> = {};

      const flows = stateRef.current.flows;
      flows.forEach((block, index) => {
        const blockCopy = { ...block, data: { ...block.data } };

        if (block.groupId) {
          if (!groups[block.groupId]) groups[block.groupId] = [];
          groups[block.groupId].push({
            id: block.id,
            itemId: nanoid(),
            data: defu(block.data, (tasks as any)[block.id]?.data),
          });

          const nextNodeInGroup = flows[index + 1]?.groupId;
          if (nextNodeInGroup) return;

          blockCopy.id = 'blocks-group';
          blockCopy.data = { blocks: groups[block.groupId] };
          delete groups[block.groupId];
        }

        const taskDef = (tasks as any)[blockCopy.id];
        const node = {
          id: nextNodeId,
          label: blockCopy.id,
          type: taskDef?.component,
          data: defu(blockCopy.data, taskDef?.data),
          position: JSON.parse(JSON.stringify(position)),
        };

        prevNodeId = nextNodeId;
        nextNodeId = nanoid();

        if (index !== flows.length - 1) {
          addEdge({
            target: nextNodeId,
            source: prevNodeId,
            targetHandle: `${nextNodeId}-input-1`,
            sourceHandle: `${prevNodeId}-output-1`,
          });
        }

        const inNewRow = (index + 1) % 5 === 0;
        position.x = inNewRow ? 50 : position.x + 280;
        position.y = inNewRow ? position.y + 150 : position.y;

        nodes.push(node);
      });

      return { edges, nodes };
    },
    []
  );

  // ── stop recording ───────────────────────────────────────
  const stopRecording = useCallback(async () => {
    const s = stateRef.current;
    if (s.isGenerating) return;

    try {
      setState((prev) => ({ ...prev, isGenerating: true }));

      if (s.flows.length !== 0) {
        if (s.workflowId) {
          const workflow = workflowStore.getById(s.workflowId);
          const startBlock = workflow.drawflow.nodes.find(
            (node: any) => node.id === s.connectFrom?.id
          );
          const updatedDrawflow = generateDrawflow(s.connectFrom, startBlock);
          const drawflow = {
            ...workflow.drawflow,
            nodes: [...workflow.drawflow.nodes, ...updatedDrawflow.nodes],
            edges: [...workflow.drawflow.edges, ...updatedDrawflow.edges],
          };
          await workflowStore.update({ id: s.workflowId, data: { drawflow } });
        } else {
          const drawflow = generateDrawflow();
          await workflowStore.insert({
            drawflow,
            name: s.name,
            description: s.description ?? '',
          });
        }
      }

      await browser.storage.local.remove(['isRecording', 'recording']);
      const action = browser.action || (browser as any).browserAction;
      await action.setBadgeText({ text: '' });

      const allTabs = (await browser.tabs.query({})).filter((tab) =>
        tab.url?.startsWith('http')
      );
      Promise.allSettled(
        allTabs.map(({ id }) =>
          browser.tabs.sendMessage(id!, { type: 'recording:stop' })
        )
      );

      setState((prev) => ({ ...prev, isGenerating: false }));

      if (s.workflowId) {
        navigate(
          `/workflows/${s.workflowId}?blockId=${s.connectFrom?.id}`,
          { replace: true }
        );
      } else {
        navigate('/', { replace: true });
      }
    } catch (error) {
      setState((prev) => ({ ...prev, isGenerating: false }));
      console.error(error);
    }
  }, [workflowStore, navigate, generateDrawflow]);

  // ── remove block ─────────────────────────────────────────
  const removeBlock = useCallback(
    (index: number) => {
      setState((prev) => {
        const newFlows = [...prev.flows];
        newFlows.splice(index, 1);
        browser.storage.local.set({ recording: { ...prev, flows: newFlows } });
        return { ...prev, flows: newFlows };
      });
    },
    []
  );

  // ── lifecycle ────────────────────────────────────────────
  useEffect(() => {
    const browserEvents = {
      onTabCreated: (event: any) => RecordWorkflowUtils.onTabCreated(event),
      onTabsActivated: (event: any) =>
        RecordWorkflowUtils.onTabsActivated(event),
      onCommitted: (event: any) =>
        RecordWorkflowUtils.onWebNavigationCommited(event),
      onWebNavigationCompleted: (event: any) =>
        RecordWorkflowUtils.onWebNavigationCompleted(event),
    };

    const onStorageChanged = ({ recording }: any) => {
      if (!recording) return;
      setState((prev) => ({ ...prev, ...recording.newValue }));
    };

    (async () => {
      const { recording, isRecording } = await browser.storage.local.get([
        'recording',
        'isRecording',
      ]);
      if (!isRecording && !recording) return;

      (window as any).stopRecording = stopRecording;

      browser.storage.onChanged.addListener(onStorageChanged);
      browser.tabs.onCreated.addListener(browserEvents.onTabCreated);
      browser.tabs.onActivated.addListener(browserEvents.onTabsActivated);
      browser.webNavigation.onCommitted.addListener(browserEvents.onCommitted);
      browser.webNavigation.onCompleted.addListener(
        browserEvents.onWebNavigationCompleted
      );

      if (recording) {
        setState((prev) => ({ ...prev, ...recording }));
      }
    })();

    return () => {
      (window as any).stopRecording = null;
      browser.storage.onChanged.removeListener(() => {});
      // cleanup listeners in production – simplified here
    };
  }, [stopRecording]);

  return (
    <div className="mx-auto w-full max-w-xl p-5">
      <div className="flex items-center">
        <button
          title={t('recording.stop')}
          className="relative flex h-12 w-12 items-center justify-center rounded-full bg-red-400 focus:ring-0"
          onClick={stopRecording}
        >
          <span
            className="absolute animate-ping rounded-full bg-red-400"
            style={{ height: '80%', width: '80%', animationDuration: '1.3s' }}
          />
          {state.isGenerating ? (
            <div className="ui-spinner text-white" />
          ) : (
            <span className="remix-icon relative z-10" data-icon="riStopLine" />
          )}
        </button>
        <div className="ml-4 flex-1 overflow-hidden">
          <p className="text-sm">{t('recording.title')}</p>
          <p className="text-overflow text-xl font-semibold leading-tight">
            {state.name}
          </p>
        </div>
      </div>

      <p className="mt-6 mb-2 font-semibold">Flows</p>
      <ul className="space-y-1">
        {state.flows.map((item, index) => {
          const taskDef = (tasks as any)[item.id];
          return (
            <li
              key={index}
              className="group flex items-center rounded-lg px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span className="remix-icon" data-icon={taskDef?.icon} />
              <div className="mx-2 flex-1 overflow-hidden">
                <p className="leading-tight">
                  {t(`workflow.blocks.${item.id}.name`)}
                </p>
                <p
                  title={item.data.description || item.description}
                  className="text-overflow text-sm leading-tight text-gray-600 dark:text-gray-300"
                >
                  {item.data.description || item.description}
                </p>
              </div>
              <button
                className="invisible cursor-pointer group-hover:visible"
                onClick={() => removeBlock(index)}
              >
                <span className="remix-icon" data-icon="riDeleteBin7Line" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Recording;
