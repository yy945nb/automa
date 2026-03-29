import React, { useState, useEffect, useRef } from 'react';
import browser from 'webextension-polyfill';
import dayjs from '@/lib/dayjs';
import UiButton from '@/components/ui/UiButton';
import UiInput from '@/components/ui/UiInput';
import UiImg from '@/components/ui/UiImg';
import UiExpand from '@/components/ui/UiExpand';
import UiSpinner from '@/components/ui/UiSpinner';
import { parseJSON } from '@/utils/helper';

declare const BROWSER_TYPE: string;

interface ParamItem {
  name: string;
  value: any;
  type: string;
  inputType?: string;
  placeholder?: string;
  description?: string;
  defaultValue?: any;
  data?: { required?: boolean };
}

interface WorkflowBlockData {
  name: string;
  description?: string;
  icon?: string;
  promptId?: string;
  timeout?: number;
  timeoutMs?: number;
  [key: string]: any;
}

interface WorkflowParam {
  type?: 'block';
  addedDate: number;
  params: ParamItem[];
  data: WorkflowBlockData;
}

function initTheme() {
  browser.storage.local.get('theme').then(({ theme }) => {
    const activeTheme = theme || 'system';
    let isDark = activeTheme === 'dark';
    if (activeTheme === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    document.documentElement.classList.toggle('dark', isDark);
  });
}

function getParamValue(param: ParamItem): any {
  const raw = param.value ?? param.defaultValue;
  switch (param.type) {
    case 'number':
      return Number.isNaN(+raw) ? 0 : +raw;
    case 'json':
      return parseJSON(raw, null);
    default:
      return raw;
  }
}

function getParamsValues(params: ParamItem[]): Record<string, any> {
  return params.reduce<Record<string, any>>((acc, param) => {
    acc[param.name] = getParamValue(param);
    return acc;
  }, {});
}

function isValidParams(params: ParamItem[]): boolean {
  return params.every((param) => {
    if (!param.data?.required) return true;
    return param.value !== '' && param.value !== null && param.value !== undefined;
  });
}

async function findWorkflow(workflowId: string): Promise<WorkflowBlockData | null> {
  if (!workflowId) return null;

  if (workflowId.startsWith('hosted')) {
    const { workflowHosts } = await browser.storage.local.get('workflowHosts');
    if (!workflowHosts) return null;
    const hostId = workflowId.split(':')[1];
    return workflowHosts[hostId] || null;
  }

  if (workflowId.startsWith('team')) {
    const { teamWorkflows } = await browser.storage.local.get('teamWorkflows');
    if (!teamWorkflows) return null;
    const teamArr: WorkflowBlockData[] = Object.values(Object.values(teamWorkflows)[0] as object);
    return teamArr.find((item) => item.id === workflowId) || null;
  }

  const { workflows: localWorkflows, workflowHosts } = await browser.storage.local.get([
    'workflows',
    'workflowHosts',
  ]);

  let workflow: WorkflowBlockData | undefined = Array.isArray(localWorkflows)
    ? localWorkflows.find(({ id }: { id: string }) => id === workflowId)
    : localWorkflows?.[workflowId];

  if (!workflow) {
    workflow = Object.values(workflowHosts || {}).find(
      (wf: any) => wf.hostId === workflowId
    ) as WorkflowBlockData | undefined;
    if (workflow) workflow = { ...workflow, id: (workflow as any).hostId };
  }

  return workflow || null;
}

// Render a parameter input based on its type
function ParamInput({
  param,
  index,
  workflowIndex,
  onUpdate,
  onExecute,
}: {
  param: ParamItem;
  index: number;
  workflowIndex: number;
  onUpdate: (workflowIndex: number, paramIndex: number, value: any) => void;
  onExecute: () => void;
}) {
  const label = param.name + (param.data?.required ? '*' : '');

  if (param.type === 'checkbox') {
    return (
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={Boolean(param.value)}
          onChange={(e) => onUpdate(workflowIndex, index, e.target.checked)}
          className="h-4 w-4 rounded"
        />
        <span>{param.placeholder || label}</span>
      </label>
    );
  }

  if (param.type === 'json') {
    return (
      <label className="flex flex-col gap-1">
        <span className="ml-1 text-sm text-gray-600 dark:text-gray-200">{label}</span>
        <textarea
          value={param.value ?? ''}
          placeholder={param.placeholder}
          className="bg-input w-full rounded-lg p-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          rows={4}
          onChange={(e) => onUpdate(workflowIndex, index, e.target.value)}
        />
      </label>
    );
  }

  // Default: string / number / text input
  return (
    <UiInput
      modelValue={param.value ?? ''}
      type={param.inputType || 'text'}
      label={label}
      placeholder={param.placeholder}
      className="w-full"
      onChange={(val) => onUpdate(workflowIndex, index, val)}
      onKeyup={(e) => {
        if (e.key === 'Enter') onExecute();
      }}
    />
  );
}

export default function App() {
  const [workflows, setWorkflows] = useState<WorkflowParam[]>([]);
  const [retrieved, setRetrieved] = useState(false);
  const checkTimeoutRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Keep a ref in sync with state so the interval can read current workflows
  const workflowsRef = useRef<WorkflowParam[]>([]);

  useEffect(() => {
    workflowsRef.current = workflows;
  }, [workflows]);

  function deleteWorkflow(index: number) {
    setWorkflows((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) window.close();
      return next;
    });
  }

  function deleteWorkflowByPromptId(promptId: string) {
    setWorkflows((prev) => {
      const next = prev.filter((wf) => wf.data.promptId !== promptId);
      if (next.length === 0) window.close();
      return next;
    });
  }

  async function addWorkflow(workflowId: string | WorkflowBlockData) {
    try {
      const workflow =
        typeof workflowId === 'string' ? await findWorkflow(workflowId) : workflowId;
      if (!workflow) return;

      const triggerBlock = workflow.drawflow?.nodes?.find(
        (node: any) => node.label === 'trigger'
      );
      if (!triggerBlock) return;

      const params: ParamItem[] = triggerBlock.data.parameters.map((param: any) => ({
        ...param,
        value: param.defaultValue,
        inputType: param.type === 'string' ? 'text' : 'number',
      }));

      setWorkflows((prev) => [
        ...prev,
        { params, data: workflow, addedDate: Date.now() },
      ]);
    } catch (error) {
      console.error(error);
    }
  }

  function runWorkflow(index: number, workflow: WorkflowParam) {
    if (!isValidParams(workflow.params)) return;

    const variables = getParamsValues(workflow.params);
    let payload: any = {
      name: 'background--workflow:execute',
      data: {
        ...workflow.data,
        options: {
          checkParams: false,
          data: { variables },
        },
      },
    };

    const isFirefox = typeof BROWSER_TYPE !== 'undefined' && BROWSER_TYPE === 'firefox';
    payload = isFirefox ? JSON.stringify(payload) : payload;

    browser.runtime
      .sendMessage(payload)
      .then(() => deleteWorkflow(index))
      .catch(console.error);
  }

  function cancelParamBlock(index: number, workflow: WorkflowParam, message: string) {
    browser.storage.local
      .set({ [workflow.data.promptId!]: { message, $isError: true } })
      .then(() => deleteWorkflow(index));
  }

  function continueWorkflow(index: number, workflow: WorkflowParam) {
    if (!isValidParams(workflow.params)) return;

    const timeout =
      (workflow.data.timeoutMs ?? 0) > 0 ? Date.now() > (workflow.data.timeout ?? 0) : false;

    browser.storage.local
      .set({
        [workflow.data.promptId!]: timeout ? { $timeout: true } : getParamsValues(workflow.params),
      })
      .then(() => deleteWorkflow(index));
  }

  function updateParam(workflowIndex: number, paramIndex: number, value: any) {
    setWorkflows((prev) =>
      prev.map((wf, wi) => {
        if (wi !== workflowIndex) return wf;
        return {
          ...wf,
          params: wf.params.map((p, pi) => (pi === paramIndex ? { ...p, value } : p)),
        };
      })
    );
  }

  // Start timeout checker for block-type workflows
  function ensureTimeoutChecker() {
    if (checkTimeoutRef.current) return;
    checkTimeoutRef.current = setInterval(() => {
      workflowsRef.current.forEach((workflow) => {
        if (
          workflow.type !== 'block' ||
          (workflow.data.timeoutMs ?? 0) <= 0 ||
          Date.now() < (workflow.data.timeout ?? 0)
        )
          return;
        const promptId = workflow.data.promptId;
        if (!promptId) return;
        browser.storage.local
          .set({ [promptId]: { message: 'Timeout', $isError: true } })
          .then(() => deleteWorkflowByPromptId(promptId));
      });
    }, 1000);
  }

  useEffect(() => {
    initTheme();

    const query = new URLSearchParams(window.location.search);
    const workflowId = query.get('workflowId');
    if (workflowId) addWorkflow(workflowId);

    setRetrieved(true);

    const messageListener = (message: any) => {
      const { name, data } = message;
      if (name === 'workflow:params') {
        addWorkflow(data);
      } else if (name === 'workflow:params-block') {
        const params = [...(data.params ?? [])];
        const blockData = { ...data };
        delete blockData.params;

        setWorkflows((prev) => [
          ...prev,
          { data: blockData, params, type: 'block', addedDate: Date.now() },
        ]);
        ensureTimeoutChecker();
      }
    };

    browser.runtime.onMessage.addListener(messageListener);
    return () => {
      browser.runtime.onMessage.removeListener(messageListener);
      if (checkTimeoutRef.current) clearInterval(checkTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sort workflows: blocks first, then by addedDate descending
  const sortedWorkflows = [...workflows].sort((a, b) => {
    if (a.type === 'block' && b.type !== 'block') return -1;
    if (b.type === 'block' && a.type !== 'block') return 1;
    return b.addedDate - a.addedDate;
  });

  if (!retrieved) {
    return (
      <div className="flex h-full items-center justify-center">
        <UiSpinner color="text-accent" size={28} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-lg flex-col dark:text-gray-100">
      <nav className="mb-4 flex w-full items-center border-b p-4">
        <span className="bg-box-transparent rounded-full p-1 dark:bg-none">
          <img src="/logo.svg" className="w-10" alt="Automa" />
        </span>
        <p className="ml-4 text-lg font-semibold">Automa</p>
      </nav>
      <div className="scroll flex-1 overflow-auto px-4 pb-4">
        <p className="my-4 text-gray-600 dark:text-gray-200">
          Input these workflows parameters before it runs.
        </p>
        {sortedWorkflows.map((workflow, index) => (
          <div key={index} className="mb-4 rounded-lg bg-white dark:bg-gray-800">
            <UiExpand
              modelValue
              appendIcon
              headerClass="flex items-center text-left p-4 w-full rounded-lg"
              headerSlot={() => (
                <div className="flex items-center">
                  {workflow.data.icon?.startsWith('http') ? (
                    <UiImg
                      src={workflow.data.icon}
                      className="overflow-hidden rounded-lg"
                      alt="icon"
                    />
                  ) : (
                    <span className="bg-box-transparent rounded-lg p-2">
                      <i className={workflow.data.icon || 'ri-flow-chart'} />
                    </span>
                  )}
                  <div className="ml-4 flex-1 overflow-hidden">
                    <p className="text-overflow mr-4 leading-tight">{workflow.data.name}</p>
                    {workflow.data.description && (
                      <p className="text-overflow leading-tight text-gray-600 dark:text-gray-200">
                        {workflow.data.description}
                      </p>
                    )}
                  </div>
                </div>
              )}
            >
              {workflow.type === 'block' && (
                <p className="px-4 pb-2">By Parameter Prompt block</p>
              )}
              <div className="px-4 pb-4">
                <ul className="space-y-4 divide-y">
                  {workflow.params.map((param, paramIdx) => (
                    <li key={paramIdx} className="flex flex-col gap-3 pt-4 first:pt-0">
                      <ParamInput
                        param={param}
                        index={paramIdx}
                        workflowIndex={index}
                        onUpdate={updateParam}
                        onExecute={() =>
                          workflow.type === 'block'
                            ? continueWorkflow(index, workflow)
                            : runWorkflow(index, workflow)
                        }
                      />
                      {param.description && (
                        <p className="ml-1 text-sm leading-tight">{param.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex items-center">
                  <p>{dayjs(workflow.addedDate).fromNow()}</p>
                  <div className="grow" />
                  {workflow.type === 'block' ? (
                    <>
                      <UiButton
                        className="mr-4"
                        onClick={() => cancelParamBlock(index, workflow, 'Canceled')}
                      >
                        Cancel
                      </UiButton>
                      <UiButton
                        disabled={!isValidParams(workflow.params)}
                        variant="accent"
                        onClick={() => continueWorkflow(index, workflow)}
                      >
                        Continue
                      </UiButton>
                    </>
                  ) : (
                    <>
                      <UiButton className="mr-4" onClick={() => deleteWorkflow(index)}>
                        Cancel
                      </UiButton>
                      <UiButton
                        disabled={!isValidParams(workflow.params)}
                        variant="accent"
                        onClick={() => runWorkflow(index, workflow)}
                      >
                        <i className="ri-play-line mr-2 -ml-1" />
                        Run
                      </UiButton>
                    </>
                  )}
                </div>
              </div>
            </UiExpand>
          </div>
        ))}
      </div>
    </div>
  );
}
