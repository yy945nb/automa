import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import browser from 'webextension-polyfill';
import { useTheme } from '@/composable/theme';
import dayjs from '@/lib/dayjs';
import { parseJSON } from '@/utils/helper';
import automa from '@business';
import workflowParameters from '@business/parameters';
import ParameterCheckboxValue from '@/components/newtab/workflow/edit/Parameter/ParameterCheckboxValue';
import ParameterInputValue from '@/components/newtab/workflow/edit/Parameter/ParameterInputValue';
import ParameterJsonValue from '@/components/newtab/workflow/edit/Parameter/ParameterJsonValue';
import UiExpand from '@/components/ui/UiExpand';
import UiImg from '@/components/ui/UiImg';
import UiInput from '@/components/ui/UiInput';
import UiButton from '@/components/ui/UiButton';
import VRemixicon from '@/components/VRemixicon';
import logoSvg from '@/assets/svg/logo.svg';

declare const BROWSER_TYPE: string;

interface ParamItem {
  name: string;
  type: string;
  value: any;
  defaultValue: any;
  inputType?: string;
  placeholder?: string;
  description?: string;
  data?: { required?: boolean };
}

interface WorkflowEntry {
  data: any;
  params: ParamItem[];
  type?: string;
  addedDate: number;
}

const initialParamsList: Record<string, any> = {
  string: {
    id: 'string',
    name: 'Input (string)',
    valueComp: ParameterInputValue,
  },
  json: {
    id: 'json',
    name: 'Input (JSON)',
    valueComp: ParameterJsonValue,
  },
  checkbox: {
    id: 'checkbox',
    name: 'Checkbox',
    valueComp: ParameterCheckboxValue,
    data: { required: false },
  },
};

const ParamsApp: React.FC = () => {
  const theme = useTheme();
  useEffect(() => { theme.init(); }, []);

  const [retrieved, setRetrieved] = useState(false);
  const [workflows, setWorkflows] = useState<WorkflowEntry[]>([]);
  const [paramsList, setParamsList] = useState(initialParamsList);
  const checkTimeoutRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sortedWorkflows = useMemo(
    () => [...workflows].sort((a, b) => b.addedDate - a.addedDate),
    [workflows]
  );

  const flattenTeamWorkflows = (items: any) => Object.values(Object.values(items)[0] as any);

  const findWorkflow = useCallback(async (workflowId: string) => {
    if (!workflowId) return null;

    if (workflowId.startsWith('hosted')) {
      const { workflowHosts } = await browser.storage.local.get('workflowHosts');
      if (!workflowHosts) return null;
      const _hostId = workflowId.split(':')[1];
      return workflowHosts[_hostId] || undefined;
    }

    if (workflowId.startsWith('team')) {
      const { teamWorkflows } = await browser.storage.local.get('teamWorkflows');
      if (!teamWorkflows) return null;
      const teamWorkflowsArr = flattenTeamWorkflows(teamWorkflows);
      return (teamWorkflowsArr as any[]).find((item) => item.id === workflowId);
    }

    const { workflows: localWorkflows, workflowHosts } =
      await browser.storage.local.get(['workflows', 'workflowHosts']);
    let workflow = Array.isArray(localWorkflows)
      ? localWorkflows.find(({ id }: any) => id === workflowId)
      : localWorkflows?.[workflowId];

    if (!workflow) {
      workflow = Object.values(workflowHosts || {}).find(
        ({ hostId }: any) => hostId === workflowId
      );
      if (workflow) (workflow as any).id = (workflow as any).hostId;
    }

    return workflow;
  }, []);

  const deleteWorkflow = useCallback(
    (index: number) => {
      setWorkflows((prev) => {
        const next = [...prev];
        next.splice(index, 1);
        if (next.length === 0) {
          window.close();
        }
        return next;
      });
    },
    []
  );

  const addWorkflow = useCallback(
    async (workflowId: string | any) => {
      try {
        const workflow =
          typeof workflowId === 'string'
            ? await findWorkflow(workflowId)
            : workflowId;
        if (!workflow) return;

        const triggerBlock = workflow.drawflow?.nodes?.find(
          (node: any) => node.label === 'trigger'
        );
        if (!triggerBlock) return;

        const params = triggerBlock.data.parameters.map((param: any) => ({
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
    },
    [findWorkflow]
  );

  const isValidParams = useCallback((params: ParamItem[]) => {
    return params.every((param) => {
      if (!param.data?.required) return true;
      return param.value;
    });
  }, []);

  const getParamsValues = useCallback(
    (params: ParamItem[]) => {
      const getParamVal: Record<string, (v: any) => any> = {
        string: (str) => str,
        number: (num) => (Number.isNaN(+num) ? 0 : +num),
        json: (value) => parseJSON(value, null),
        default: (value) => value,
      };

      return params.reduce((acc: Record<string, any>, param) => {
        const valueFunc =
          getParamVal[param.type] ||
          paramsList[param.type]?.getValue ||
          getParamVal.default;
        const value = valueFunc(param.value || param.defaultValue);
        acc[param.name] = value;
        return acc;
      }, {});
    },
    [paramsList]
  );

  const runWorkflow = useCallback(
    (index: number, entry: WorkflowEntry) => {
      if (!isValidParams(entry.params)) return;

      const variables = getParamsValues(entry.params);
      let payload: any = {
        name: 'background--workflow:execute',
        data: {
          ...entry.data,
          options: {
            checkParams: false,
            data: { variables },
          },
        },
      };
      const isFirefox = BROWSER_TYPE === 'firefox';
      payload = isFirefox ? JSON.stringify(payload) : payload;

      browser.runtime
        .sendMessage(payload)
        .then(() => {
          deleteWorkflow(index);
        })
        .catch((error) => {
          console.error(error);
        });
    },
    [isValidParams, getParamsValues, deleteWorkflow]
  );

  const cancelParamBlock = useCallback(
    (index: number, entry: WorkflowEntry, message: string) => {
      browser.storage.local
        .set({
          [entry.data.promptId]: { message, $isError: true },
        })
        .then(() => {
          deleteWorkflow(index);
        });
    },
    [deleteWorkflow]
  );

  const continueWorkflow = useCallback(
    (index: number, entry: WorkflowEntry) => {
      if (!isValidParams(entry.params)) return;

      const timeout =
        entry.data.timeoutMs > 0 ? Date.now() > entry.data.timeout : false;

      browser.storage.local
        .set({
          [entry.data.promptId]: timeout
            ? { $timeout: true }
            : getParamsValues(entry.params),
        })
        .then(() => {
          deleteWorkflow(index);
        });
    },
    [isValidParams, getParamsValues, deleteWorkflow]
  );

  const updateParamValue = useCallback(
    (workflowIndex: number, paramIndex: number, value: any) => {
      setWorkflows((prev) => {
        const next = [...prev];
        const entry = { ...next[workflowIndex] };
        const params = [...entry.params];
        params[paramIndex] = { ...params[paramIndex], value };
        entry.params = params;
        next[workflowIndex] = entry;
        return next;
      });
    },
    []
  );

  // Listen for runtime messages
  useEffect(() => {
    const listener = ({ name, data }: any) => {
      if (name === 'workflow:params') {
        addWorkflow(data);
      } else if (name === 'workflow:params-block') {
        const params = [...data.params];
        const blockData = { ...data };
        delete blockData.params;

        setWorkflows((prev) => [
          ...prev,
          { data: blockData, params, type: 'block', addedDate: Date.now() },
        ]);

        if (!checkTimeoutRef.current) {
          checkTimeoutRef.current = setInterval(() => {
            setWorkflows((prev) =>
              prev.filter((workflow, index) => {
                if (
                  workflow.type !== 'block' ||
                  Date.now() < workflow.data.timeout ||
                  workflow.data.timeoutMs <= 0
                )
                  return true;

                // Cancel timed out blocks
                browser.storage.local.set({
                  [workflow.data.promptId]: { message: 'Timeout', $isError: true },
                });
                return false;
              })
            );
          }, 1000);
        }
      }
    };

    browser.runtime.onMessage.addListener(listener);
    return () => {
      browser.runtime.onMessage.removeListener(listener);
      if (checkTimeoutRef.current) clearInterval(checkTimeoutRef.current);
    };
  }, [addWorkflow]);

  // Init on mount
  useEffect(() => {
    (async () => {
      try {
        const query = new URLSearchParams(window.location.search);
        const workflowId = query.get('workflowId');
        if (workflowId) addWorkflow(workflowId);
        await automa('content');

        const extraParams = workflowParameters();
        setParamsList((prev) => ({ ...prev, ...extraParams }));
      } catch (error) {
        // Do nothing
      } finally {
        setRetrieved(true);
      }
    })();
  }, []);

  if (!retrieved) return null;

  return (
    <div className="mx-auto flex h-full w-full max-w-lg flex-col dark:text-gray-100">
      <nav className="mb-4 flex w-full items-center border-b p-4">
        <span className="bg-box-transparent rounded-full p-1 dark:bg-none">
          <img src={logoSvg} className="w-10" alt="Automa" />
        </span>
        <p className="ml-4 text-lg font-semibold">Automa</p>
      </nav>
      <div className="scroll flex-1 overflow-auto px-4 pb-4">
        <p className="my-4 text-gray-600 dark:text-gray-200">
          Input these workflows parameters before it runs.
        </p>
        {sortedWorkflows.map((workflow, index) => {
          // Find original index in the workflows array
          const origIndex = workflows.indexOf(workflow);

          return (
            <UiExpand
              key={index}
              defaultOpen
              appendIcon
              headerClassName="flex items-center text-left p-4 w-full rounded-lg"
              className="mb-4 rounded-lg bg-white dark:bg-gray-800"
              header={
                <>
                  {workflow.data.icon?.startsWith('http') ? (
                    <UiImg
                      src={workflow.data.icon}
                      className="overflow-hidden rounded-lg"
                      style={{ height: 40, width: 40 }}
                      alt="Can not display"
                    />
                  ) : (
                    <span className="bg-box-transparent rounded-lg p-2">
                      <VRemixicon name={workflow.data.icon} />
                    </span>
                  )}
                  <div className="ml-4 flex-1 overflow-hidden">
                    <p className="text-overflow mr-4 leading-tight">
                      {workflow.data.name}
                    </p>
                    <p className="text-overflow leading-tight text-gray-600 dark:text-gray-200">
                      {workflow.data.description}
                    </p>
                  </div>
                </>
              }
            >
              {workflow.type === 'block' && (
                <p className="px-4 pb-2">By Parameter Prompt block</p>
              )}
              <div className="px-4 pb-4">
                <ul className="space-y-4 divide-y">
                  {workflow.params.map((param, paramIdx) => {
                    const ParamComp = paramsList[param.type]?.valueComp;
                    return (
                      <li key={paramIdx} className="flex flex-col gap-3">
                        {ParamComp ? (
                          <ParamComp
                            value={param.value}
                            onChange={(val: any) =>
                              updateParamValue(origIndex, paramIdx, val)
                            }
                            autoFocus={paramIdx === 0}
                            label={
                              param.name + (param.data?.required ? '*' : '')
                            }
                            paramData={param}
                            className="w-full"
                            onExecute={() =>
                              workflow.type === 'block'
                                ? continueWorkflow(origIndex, workflow)
                                : runWorkflow(origIndex, workflow)
                            }
                          />
                        ) : (
                          <UiInput
                            value={param.value}
                            onChange={(e: any) =>
                              updateParamValue(
                                origIndex,
                                paramIdx,
                                e.target?.value ?? e
                              )
                            }
                            type={param.inputType}
                            label={
                              param.name + (param.data?.required ? '*' : '')
                            }
                            placeholder={param.placeholder}
                            className="w-full"
                          />
                        )}
                        {param.description && (
                          <p
                            title="Description"
                            className="ml-1 text-sm leading-tight"
                          >
                            {param.description}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-6 flex items-center">
                  <p>{dayjs(workflow.addedDate).fromNow()}</p>
                  <div className="grow" />
                  {workflow.type === 'block' ? (
                    <>
                      <UiButton
                        className="mr-4"
                        onClick={() =>
                          cancelParamBlock(origIndex, workflow, 'Canceled')
                        }
                      >
                        Cancel
                      </UiButton>
                      <UiButton
                        disabled={!isValidParams(workflow.params)}
                        variant="accent"
                        onClick={() => continueWorkflow(origIndex, workflow)}
                      >
                        Continue
                      </UiButton>
                    </>
                  ) : (
                    <>
                      <UiButton
                        className="mr-4"
                        onClick={() => deleteWorkflow(origIndex)}
                      >
                        Cancel
                      </UiButton>
                      <UiButton
                        disabled={!isValidParams(workflow.params)}
                        variant="accent"
                        onClick={() => runWorkflow(origIndex, workflow)}
                      >
                        <VRemixicon name="riPlayLine" className="mr-2 -ml-1" />
                        Run
                      </UiButton>
                    </>
                  )}
                </div>
              </div>
            </UiExpand>
          );
        })}
      </div>
    </div>
  );
};

export default ParamsApp;
