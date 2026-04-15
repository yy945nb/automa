import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import browser from 'webextension-polyfill';
import cloneDeep from 'lodash.clonedeep';
import ParameterInputValue from '@/components/newtab/workflow/edit/Parameter/ParameterInputValue';
import ParameterJsonValue from '@/components/newtab/workflow/edit/Parameter/ParameterJsonValue';
import RendererWorkflowService from '@/service/renderer/RendererWorkflowService';
import { debounce, parseJSON } from '@/utils/helper';
import { sendMessage } from '@/utils/message';
import workflowParameters from '@business/parameters';
import UiCard from '@/components/ui/UiCard';
import UiSpinner from '@/components/ui/UiSpinner';
import UiButton from '@/components/ui/UiButton';
import UiInput from '@/components/ui/UiInput';
import UiList from '@/components/ui/UiList';
import UiListItem from '@/components/ui/UiListItem';
import VRemixicon from '@/components/VRemixicon';

interface CommandPaletteAppProps {
  rootElement?: HTMLElement;
}

const os = navigator.appVersion.indexOf('Mac') !== -1 ? 'mac' : 'win';

const logoUrl = browser.runtime.getURL(
  process.env.NODE_ENV === 'development' ? '/icon-dev-128.png' : '/icon-128.png'
);

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
};

const CommandPaletteApp: React.FC<CommandPaletteAppProps> = ({ rootElement }) => {
  const [active, setActive] = useState(false);
  const [query, setQuery] = useState('');
  const [allWorkflows, setAllWorkflows] = useState<any[]>([]);
  const [shortcutKeys, setShortcutKeys] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [retrieved, setRetrieved] = useState(false);
  const [paramsList, setParamsList] = useState(initialParamsList);

  // Params state
  const [paramsActive, setParamsActive] = useState(false);
  const [paramsItems, setParamsItems] = useState<any[]>([]);
  const [paramsWorkflow, setParamsWorkflow] = useState<any>({});
  const [paramsInputtedVal, setParamsInputtedVal] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  const workflows = useMemo(
    () =>
      allWorkflows.filter((workflow) =>
        workflow.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())
      ),
    [allWorkflows, query]
  );

  const getReadableShortcut = useCallback(
    (str: string) => {
      const list: Record<string, Record<string, string>> = {
        option: { win: 'alt', mac: 'option' },
        mod: { win: 'ctrl', mac: '⌘' },
      };
      const regex = /option|mod/g;
      return str.replace(regex, (match) => list[match]?.[os] || match);
    },
    []
  );

  const clearParamsState = useCallback(() => {
    setParamsActive(false);
    setParamsItems([]);
    setParamsWorkflow({});
    setParamsInputtedVal('');
  }, []);

  const sendExecuteCommand = useCallback(
    (workflow: any, options: any = {}) => {
      const workflowData = {
        ...workflow,
        includeTabId: true,
        options: { ...options, checkParams: false },
      };
      RendererWorkflowService.executeWorkflow(workflowData);
      setActive(false);
    },
    []
  );

  const getParamsValues = useCallback(
    (params: any[]) => {
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

  const executeWorkflowWithParams = useCallback(() => {
    const variables = getParamsValues(paramsItems);
    sendExecuteCommand(paramsWorkflow, { data: { variables } });
    clearParamsState();
  }, [getParamsValues, paramsItems, paramsWorkflow, sendExecuteCommand, clearParamsState]);

  const executeWorkflow = useCallback(
    (workflow: any) => {
      if (!workflow) return;

      let triggerData = workflow.trigger;
      if (!triggerData) {
        const triggerNode = workflow.drawflow?.nodes?.find(
          (node: any) => node.label === 'trigger'
        );
        triggerData = triggerNode?.data;
      }

      if (triggerData?.parameters?.length > 0) {
        const keys = new Set<string>();
        const params: any[] = [];
        triggerData.parameters.forEach((param: any) => {
          if (keys.has(param.name)) return;
          params.push(param);
          keys.add(param.name);
        });

        const parameters = cloneDeep(triggerData.parameters).map((item: any) => ({
          ...item,
          value: item.defaultValue,
        }));

        setParamsWorkflow(workflow);
        setParamsItems(parameters);
        setParamsActive(true);
      } else {
        sendExecuteCommand(workflow);
      }

      if (inputRef.current) inputRef.current.value = '';
      setQuery('');
      setParamsInputtedVal('');
    },
    [sendExecuteCommand]
  );

  const onInputKeydown = useCallback(
    (event: React.KeyboardEvent) => {
      const { key } = event;

      if (key !== 'Escape') {
        event.stopPropagation();
      }

      if (['ArrowDown', 'ArrowUp'].includes(key)) {
        let nextIndex = selectedIndex;
        const maxIndex = workflows.length - 1;

        if (key === 'ArrowDown') {
          nextIndex += 1;
          if (nextIndex > maxIndex) nextIndex = 0;
        } else if (key === 'ArrowUp') {
          nextIndex -= 1;
          if (nextIndex < 0) nextIndex = maxIndex;
        }

        setSelectedIndex(nextIndex);
        return;
      }

      if (key === 'Enter') {
        if (paramsActive) return;
        executeWorkflow(workflows[selectedIndex]);
      }
    },
    [selectedIndex, workflows, paramsActive, executeWorkflow]
  );

  const onInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;

      if (paramsActive) {
        setParamsInputtedVal(value);
      } else {
        setQuery(value);
      }
    },
    [paramsActive]
  );

  const openDashboard = useCallback(() => {
    sendMessage('open:dashboard', '', 'background');
  }, []);

  // Focus input when active
  useEffect(() => {
    if (active && inputRef.current) {
      inputRef.current.focus();
    }
  }, [active]);

  // Fetch workflows when first activated
  useEffect(() => {
    if (!retrieved && active) {
      (async () => {
        const {
          workflows: localWorkflows,
          workflowHosts,
          teamWorkflows,
        } = await browser.storage.local.get([
          'workflows',
          'workflowHosts',
          'teamWorkflows',
        ]);
        setAllWorkflows([
          ...Object.values(workflowHosts || {}),
          ...Object.values(localWorkflows || {}),
          ...Object.values(
            (Object.values(teamWorkflows || {})[0] as any) || {}
          ),
        ]);
        setRetrieved(true);
      })();
    } else if (!active) {
      clearParamsState();
      setQuery('');
      setSelectedIndex(-1);
    }
  }, [active, retrieved, clearParamsState]);

  // Scroll selected item into view
  useEffect(() => {
    const debouncedScroll = debounce((idx: number) => {
      if (!rootElement) return;
      const container = rootElement.shadowRoot?.querySelector(
        '#workflows-container .workflows-list'
      );
      const element = rootElement.shadowRoot?.querySelector(
        `#list-item-${idx}`
      );

      if (element && container) {
        const cTop = container.scrollTop;
        const cBottom = cTop + container.clientHeight;
        const eTop = (element as HTMLElement).offsetTop;
        const eBottom = eTop + (element as HTMLElement).clientHeight;
        const isInView =
          (eTop >= cTop && eBottom <= cBottom) ||
          (eTop < cTop && eBottom > cTop) ||
          (eBottom > cBottom && eTop < cBottom);

        if (!isInView) {
          element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    }, 100);

    debouncedScroll(selectedIndex);
  }, [selectedIndex, rootElement]);

  // Global keydown handler
  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      const { ctrlKey, altKey, metaKey, key, shiftKey } = event;

      if (key === 'Escape') {
        if (paramsActive) {
          clearParamsState();
        } else {
          setActive(false);
        }
        return;
      }

      const shortcuts = (window as any)._automaShortcuts;
      if (!shortcuts || shortcuts.length < 1) return;

      const automaShortcut = shortcuts.every((shortcutKey: string) => {
        if (shortcutKey === 'mod') return ctrlKey || metaKey;
        if (shortcutKey === 'shift') return shiftKey;
        if (shortcutKey === 'option') return altKey;
        return shortcutKey === key.toLowerCase();
      });

      if (automaShortcut) {
        event.preventDefault();
        setActive(true);
        setShortcutKeys(shortcuts);
      }
    };

    window.addEventListener('keydown', onKeydown);
    return () => {
      window.removeEventListener('keydown', onKeydown);
    };
  }, [paramsActive, clearParamsState]);

  // Init shortcuts and params on mount
  useEffect(() => {
    browser.storage.local.get('automaShortcut').then(({ automaShortcut }) => {
      if (Array.isArray(automaShortcut) && automaShortcut.length < 1) return;

      let keys = ['mod', 'shift', 'e'];
      if (automaShortcut) keys = automaShortcut.split('+');

      setShortcutKeys(keys);
      (window as any)._automaShortcuts = keys;
    });

    const extraParams = workflowParameters();
    setParamsList((prev) => ({ ...prev, ...extraParams }));

    // Expose init function for external use
    (window as any).initPaletteParams = (data: any) => {
      setParamsItems(data.params);
      setParamsWorkflow(data.workflow);
      setParamsActive(true);
      setActive(true);
    };
  }, []);

  if (!active) return null;

  return (
    <div
      className="fixed top-0 left-0 h-full w-full bg-black bg-opacity-50 p-4 text-black"
      style={{ zIndex: 99999999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setActive(false);
      }}
    >
      <UiCard
        id="workflows-container"
        className="absolute w-full max-w-2xl"
        padding="p-0"
        style={{ left: '50%', top: '50px', transform: 'translateX(-50%)' }}
      >
        {/* Search input */}
        <div className="p-4">
          <label className="bg-input flex h-12 items-center rounded-lg px-2 ring-accent transition focus-within:ring-2">
            <img src={logoUrl} className="h-8 w-8" alt="Automa" />
            <input
              ref={inputRef}
              type="text"
              className="h-full flex-1 rounded-lg bg-transparent px-2 focus:ring-0"
              placeholder={
                paramsActive
                  ? paramsWorkflow.name
                  : 'Search workflows...'
              }
              onChange={onInput}
              onKeyDown={onInputKeydown as any}
            />
            {shortcutKeys.map((key) => (
              <span
                key={key}
                className="bg-box-transparent ml-1 inline-block rounded-md border-2 border-gray-300 p-1 text-center text-xs font-semibold capitalize text-gray-600"
                style={{ minWidth: '29px', fontFamily: 'inherit' }}
              >
                {getReadableShortcut(key)}
              </span>
            ))}
          </label>
        </div>

        {/* Workflows list */}
        <div
          className="scroll workflows-list overflow-auto px-4 pb-4"
          style={{ maxHeight: 'calc(100vh - 200px)' }}
        >
          {!retrieved ? (
            <div className="mb-2 text-center">
              <UiSpinner color="text-accent" />
            </div>
          ) : paramsActive ? (
            <div>
              <ul className="space-y-4 divide-y">
                {paramsItems.map((param, paramIdx) => {
                  const ParamComp = paramsList[param.type]?.valueComp;
                  return (
                    <li key={paramIdx}>
                      {ParamComp ? (
                        <ParamComp
                          value={param.value}
                          onChange={(val: any) => {
                            setParamsItems((prev) => {
                              const next = [...prev];
                              next[paramIdx] = { ...next[paramIdx], value: val };
                              return next;
                            });
                          }}
                          label={param.name}
                          paramData={param}
                          className="w-full"
                        />
                      ) : (
                        <UiInput
                          value={param.value}
                          onChange={(e: any) => {
                            const val = e.target?.value ?? e;
                            setParamsItems((prev) => {
                              const next = [...prev];
                              next[paramIdx] = { ...next[paramIdx], value: val };
                              return next;
                            });
                          }}
                          type={param.inputType || param.type}
                          label={param.name}
                          placeholder={param.placeholder}
                          className="w-full"
                          onKeyUp={(e: any) => {
                            if (e.key === 'Enter') executeWorkflowWithParams();
                          }}
                        />
                      )}
                      {param.description && (
                        <p title="Description" className="ml-1 text-sm">
                          {param.description}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <>
              {query && workflows.length === 0 ? (
                <p className="text-center text-gray-600">
                  Can&apos;t find workflows
                </p>
              ) : (
                <UiList className="space-y-1">
                  {workflows.map((workflow, index) => (
                    <UiListItem
                      key={workflow.id}
                      id={`list-item-${index}`}
                      active={index === selectedIndex}
                      small
                      color="bg-box-transparent list-item-active"
                      className="group cursor-pointer"
                      onMouseEnter={() => setSelectedIndex(index)}
                      onClick={() => executeWorkflow(workflow)}
                    >
                      <div className="w-8">
                        {workflow.icon?.startsWith('http') ? (
                          <img
                            src={workflow.icon}
                            className="overflow-hidden rounded-lg"
                            style={{ height: 26, width: 26 }}
                            alt="Can not display"
                          />
                        ) : (
                          <VRemixicon
                            name={workflow.icon || 'riGlobalLine'}
                            size={26}
                          />
                        )}
                      </div>
                      <div className="mx-2 flex-1 overflow-hidden">
                        <p className="text-overflow">{workflow.name}</p>
                        <p className="text-overflow leading-tight text-gray-500">
                          {workflow.description}
                        </p>
                      </div>
                      <VRemixicon
                        name="riArrowGoForwardLine"
                        className="invisible text-gray-600 group-hover:visible"
                        size={20}
                        rotate={180}
                      />
                    </UiListItem>
                  ))}
                </UiList>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center px-4 py-2">
          {paramsActive ? (
            <div className="pl-2 text-gray-500">
              <div className="flex items-center">
                <p className="mr-4">{paramsWorkflow.description}</p>
                <p>
                  Press{' '}
                  <span className="bg-box-transparent ml-1 inline-block rounded-md border-2 border-gray-300 p-1 text-center text-xs font-semibold text-gray-600">
                    Escape
                  </span>{' '}
                  to cancel
                </p>
              </div>
            </div>
          ) : (
            <p
              className="inline-flex cursor-pointer items-center text-gray-600"
              onClick={openDashboard}
            >
              Open dashboard
              <VRemixicon
                name="riExternalLinkLine"
                className="ml-1 inline-block"
                size={20}
              />
            </p>
          )}
          <div className="grow" />
          {paramsActive && (
            <UiButton variant="accent" onClick={executeWorkflowWithParams}>
              Execute
            </UiButton>
          )}
        </div>
      </UiCard>
    </div>
  );
};

export default CommandPaletteApp;
