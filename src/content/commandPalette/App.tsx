import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import browser from 'webextension-polyfill';
import cloneDeep from 'lodash.clonedeep';
import { debounce, parseJSON } from '@/utils/helper';
import { sendMessage } from '@/utils/message';
import RendererWorkflowService from '@/service/renderer/RendererWorkflowService';
import workflowParameters from '@business/parameters';

const os = navigator.appVersion.indexOf('Mac') !== -1 ? 'mac' : 'win';

const logoUrl = browser.runtime.getURL(
  process.env.NODE_ENV === 'development' ? '/icon-dev-128.png' : '/icon-128.png'
);

interface Workflow {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  trigger?: any;
  drawflow?: any;
  options?: any;
  [key: string]: any;
}

interface ParamsState {
  items: any[];
  workflow: Workflow | Record<string, never>;
  active: boolean;
  activeIndex: number;
  inputtedVal: string;
}

interface AppProps {
  rootElement?: HTMLElement & { shadowRoot: ShadowRoot };
}

export default function App({ rootElement }: AppProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [active, setActive] = useState(false);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [shortcutKeys, setShortcutKeys] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [retrieved, setRetrieved] = useState(false);

  const [paramsState, setParamsState] = useState<ParamsState>({
    items: [],
    workflow: {},
    active: false,
    activeIndex: 0,
    inputtedVal: '',
  });

  const filteredWorkflows = useMemo(
    () =>
      workflows.filter((wf) =>
        wf.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())
      ),
    [workflows, query]
  );

  function getReadableShortcut(str: string) {
    const list: Record<string, Record<string, string>> = {
      option: { win: 'alt', mac: 'option' },
      mod: { win: 'ctrl', mac: '⌘' },
    };
    return str.replace(/option|mod/g, (match) => list[match]?.[os] ?? match);
  }

  function clearParamsState() {
    setParamsState({ items: [], workflow: {}, active: false, activeIndex: 0, inputtedVal: '' });
  }

  function sendExecuteCommand(workflow: Workflow, options: Record<string, any> = {}) {
    const workflowData = { ...workflow, includeTabId: true, options: { ...options, checkParams: false } };
    RendererWorkflowService.executeWorkflow(workflowData, workflowData.options);
    setActive(false);
  }

  function executeWorkflow(workflow: Workflow | undefined) {
    if (!workflow) return;

    let triggerData = workflow.trigger;
    if (!triggerData) {
      const triggerNode = workflow.drawflow?.nodes?.find(
        (node: any) => node.label === 'trigger'
      );
      triggerData = triggerNode?.data;
    }

    if (triggerData?.parameters?.length > 0) {
      const parameters = cloneDeep(triggerData.parameters).map((item: any) => ({
        ...item,
        value: item.defaultValue,
      }));

      setParamsState((prev) => ({ ...prev, workflow, items: parameters, active: true }));
    } else {
      sendExecuteCommand(workflow);
    }

    if (inputRef.current) inputRef.current.value = '';
    setQuery('');
  }

  function getParamsValues(params: any[]) {
    const getParamVal: Record<string, (v: any) => any> = {
      string: (str: string) => str,
      number: (num: string) => (Number.isNaN(+num) ? 0 : +num),
      json: (value: string) => parseJSON(value, null),
      default: (value: any) => value,
    };

    return params.reduce((acc: Record<string, any>, param: any) => {
      const valueFunc = getParamVal[param.type] || getParamVal.default;
      acc[param.name] = valueFunc(param.value || param.defaultValue);
      return acc;
    }, {});
  }

  function executeWorkflowWithParams() {
    const variables = getParamsValues(paramsState.items);
    sendExecuteCommand(paramsState.workflow as Workflow, { data: { variables } });
    clearParamsState();
  }

  function checkInView(container: HTMLElement, element: HTMLElement, partial = false) {
    const cTop = container.scrollTop;
    const cBottom = cTop + container.clientHeight;
    const eTop = element.offsetTop;
    const eBottom = eTop + element.clientHeight;
    const isTotal = eTop >= cTop && eBottom <= cBottom;
    const isPartial =
      partial &&
      ((eTop < cTop && eBottom > cTop) || (eBottom > cBottom && eTop < cBottom));
    return isTotal || isPartial;
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const scrollToItem = useCallback(
    debounce((activeIdx: number) => {
      const shadowRoot = rootElement?.shadowRoot;
      if (!shadowRoot) return;
      const container = shadowRoot.querySelector<HTMLElement>(
        '#workflows-container .workflows-list'
      );
      const element = shadowRoot.querySelector<HTMLElement>(`#list-item-${activeIdx}`);
      if (element && container && !checkInView(container, element)) {
        element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 100),
    [rootElement]
  );

  useEffect(() => {
    scrollToItem(selectedIndex);
  }, [selectedIndex, scrollToItem]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [active]);

  useEffect(() => {
    const loadWorkflowsIfNeeded = async () => {
      if (!retrieved && active) {
        const { workflows: localWorkflows, workflowHosts, teamWorkflows } =
          await browser.storage.local.get(['workflows', 'workflowHosts', 'teamWorkflows']) as any;
        setWorkflows([
          ...Object.values(workflowHosts || {}),
          ...Object.values(localWorkflows || {}),
          ...Object.values(Object.values((teamWorkflows || {}) as Record<string, any>)[0] || {}),
        ] as Workflow[]);
        setRetrieved(true);
      } else if (!active) {
        clearParamsState();
        setQuery('');
        setSelectedIndex(-1);
      }
    };

    loadWorkflowsIfNeeded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    function onKeydown(event: KeyboardEvent) {
      const { ctrlKey, altKey, metaKey, key, shiftKey } = event;

      if (key === 'Escape') {
        if (paramsState.active) {
          clearParamsState();
        } else {
          setActive(false);
        }
        return;
      }

      const shortcuts = (window as any)._automaShortcuts as string[] | undefined;
      if (!shortcuts || shortcuts.length < 1) return;

      const automaShortcut = shortcuts.every((shortcutKey) => {
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
    }

    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsState.active]);

  useEffect(() => {
    browser.storage.local.get('automaShortcut').then(({ automaShortcut }: any) => {
      if (Array.isArray(automaShortcut) && automaShortcut.length < 1) return;

      let keys = ['mod', 'shift', 'e'];
      if (automaShortcut) keys = automaShortcut.split('+');

      setShortcutKeys(keys);
      (window as any)._automaShortcuts = keys;
    });

    // Expose global init for external callers
    (window as any).initPaletteParams = (data: { params: any[]; workflow: Workflow }) => {
      setParamsState((prev) => ({
        ...prev,
        items: data.params,
        workflow: data.workflow,
        active: true,
      }));
      setActive(true);
    };

    return () => {
      delete (window as any).initPaletteParams;
    };
  }, []);

  function onInputKeydown(event: React.KeyboardEvent<HTMLInputElement>) {
    const { key } = event;
    if (key !== 'Escape') event.stopPropagation();

    if (['ArrowDown', 'ArrowUp'].includes(key)) {
      setSelectedIndex((prev) => {
        const maxIndex = filteredWorkflows.length - 1;
        if (key === 'ArrowDown') {
          const next = prev + 1;
          return next > maxIndex ? 0 : next;
        }
        const next = prev - 1;
        return next < 0 ? maxIndex : next;
      });
      return;
    }

    if (key === 'Enter' && !paramsState.active) {
      executeWorkflow(filteredWorkflows[selectedIndex]);
    }
  }

  function onInput(event: React.ChangeEvent<HTMLInputElement>) {
    const { value } = event.target;
    if (paramsState.active) {
      setParamsState((prev) => ({
        ...prev,
        inputtedVal: value,
        activeIndex: value.split(';').length - 1,
      }));
    } else {
      setQuery(value);
    }
  }

  function openDashboard() {
    sendMessage('open:dashboard', '', 'background');
  }

  if (!active) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed top-0 left-0 h-full w-full bg-black bg-opacity-50 p-4 text-black"
      style={{ zIndex: 99999999 }}
      onClick={(e) => { if (e.target === e.currentTarget) setActive(false); }}
    >
      <div
        id="workflows-container"
        className="absolute w-full max-w-2xl rounded-lg bg-white shadow-xl"
        style={{ left: '50%', top: 50, transform: 'translateX(-50%)' }}
      >
        {/* Search input */}
        <div className="p-4">
          <label className="bg-input flex h-12 items-center rounded-lg px-2 ring-accent transition focus-within:ring-2">
            <img src={logoUrl} className="h-8 w-8" alt="Automa" />
            <input
              ref={inputRef}
              type="text"
              className="h-full flex-1 rounded-lg bg-transparent px-2 focus:ring-0"
              placeholder={paramsState.active ? (paramsState.workflow as Workflow).name : 'Search workflows...'}
              onInput={onInput}
              onKeyDown={onInputKeydown}
            />
            {shortcutKeys.map((key) => (
              <span
                key={key}
                className="bg-box-transparent ml-1 inline-block rounded-md border-2 border-gray-300 p-1 text-center text-xs font-semibold capitalize text-gray-600"
                style={{ minWidth: 29, fontFamily: 'inherit' }}
              >
                {getReadableShortcut(key)}
              </span>
            ))}
          </label>
        </div>

        {/* Workflow list */}
        <div
          className="scroll workflows-list overflow-auto px-4 pb-4"
          style={{ maxHeight: 'calc(100vh - 200px)' }}
        >
          {!retrieved ? (
            <div className="mb-2 text-center">
              <i className="ri-loader-4-line animate-spin text-accent" />
            </div>
          ) : (
            <>
              {paramsState.active ? (
                <ul className="space-y-4 divide-y">
                  {paramsState.items.map((param: any, paramIdx: number) => (
                    <li key={paramIdx}>
                      <input
                        type={param.inputType || param.type}
                        value={param.value ?? ''}
                        placeholder={param.placeholder}
                        className="bg-input w-full rounded-lg px-4 py-2"
                        onChange={(e) => {
                          const updated = [...paramsState.items];
                          updated[paramIdx] = { ...updated[paramIdx], value: e.target.value };
                          setParamsState((prev) => ({ ...prev, items: updated }));
                        }}
                      />
                      {param.description && (
                        <p title="Description" className="ml-1 text-sm">
                          {param.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <>
                  {query && filteredWorkflows.length === 0 && (
                    <p className="text-center text-gray-600">Can&apos;t find workflows</p>
                  )}
                  <ul className="space-y-1">
                    {filteredWorkflows.map((workflow, index) => (
                      <li
                        id={`list-item-${index}`}
                        key={workflow.id}
                        className={`group flex cursor-pointer items-center rounded-lg p-2 transition${
                          index === selectedIndex ? ' bg-box-transparent' : ''
                        }`}
                        onMouseEnter={() => setSelectedIndex(index)}
                        onClick={() => executeWorkflow(workflow)}
                      >
                        <div className="w-8">
                          {workflow.icon?.startsWith('http') ? (
                            <img
                              src={workflow.icon}
                              className="overflow-hidden rounded-lg"
                              style={{ height: 26, width: 26 }}
                              alt="workflow icon"
                            />
                          ) : (
                            <i className={workflow.icon || 'ri-global-line'} style={{ fontSize: 26 }} />
                          )}
                        </div>
                        <div className="mx-2 flex-1 overflow-hidden">
                          <p className="text-overflow">{workflow.name}</p>
                          <p className="text-overflow leading-tight text-gray-500">
                            {workflow.description}
                          </p>
                        </div>
                        <i className="ri-arrow-go-forward-line invisible text-gray-600 group-hover:visible" style={{ fontSize: 20 }} />
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center px-4 py-2">
          {paramsState.active ? (
            <div className="pl-2 text-gray-500">
              <div className="flex items-center">
                <p className="mr-4">{(paramsState.workflow as Workflow).description}</p>
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
              Open dashboard{' '}
              <i className="ri-external-link-line ml-1 inline-block" style={{ fontSize: 20 }} />
            </p>
          )}
          <div className="grow" />
          {paramsState.active && (
            <button
              className="rounded-lg bg-accent px-4 py-2 text-white"
              onClick={executeWorkflowWithParams}
            >
              Execute
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
