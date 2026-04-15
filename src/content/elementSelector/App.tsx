import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import browser from 'webextension-polyfill';
import SelectorElementsDetail from '@/components/content/selector/SelectorElementsDetail';
import SelectorQuery from '@/components/content/selector/SelectorQuery';
import SharedElementSelector from '@/components/content/shared/SharedElementSelector';
import findSelector from '@/lib/findSelector';
import FindElement from '@/utils/FindElement';
import { debounce } from '@/utils/helper';
import { getElementRect } from '../utils';
import getSelectorOptions from './getSelectorOptions';
import UiButton from '@/components/ui/UiButton';
import UiSwitch from '@/components/ui/UiSwitch';
import UiTextarea from '@/components/ui/UiTextarea';
import VRemixicon from '@/components/VRemixicon';

interface ElementSelectorAppProps {
  rootElement?: HTMLElement;
}

const originalFontSize = document.documentElement.style.fontSize;

const ElementSelectorApp: React.FC<ElementSelectorAppProps> = ({ rootElement }) => {
  const [hide, setHide] = useState(false);
  const [elSelector, setElSelector] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectList, setSelectList] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectElements, setSelectElements] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [selectorType, setSelectorType] = useState('css');
  const [selectedElements, setSelectedElements] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('attributes');
  const [isSelectBlockElement, setIsSelectBlockElement] = useState(false);

  const [cardPos, setCardPos] = useState({ x: 0, y: 0 });
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });

  const [selectorSettings, setSelectorSettings] = useState({
    idName: true,
    tagName: true,
    attr: true,
    className: true,
    attrNames: 'data-testid',
  });

  const cardRef = useRef<HTMLDivElement>(null);
  const connectedPortRef = useRef<any>(null);
  const selectedElementRef = useRef<{
    path: HTMLElement[];
    pathIndex: number;
    cache: WeakMap<HTMLElement, string>;
  }>({
    path: [],
    pathIndex: 0,
    cache: new WeakMap(),
  });

  const updateSelectorSetting = useCallback(
    (key: string, value: any) => {
      setSelectorSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearConnectedPort = useCallback(() => {
    connectedPortRef.current = null;
    setIsSelectBlockElement(false);
  }, []);

  const destroy = useCallback(() => {
    if (rootElement) rootElement.style.display = 'none';

    setHide(true);
    setActiveTab('');
    setElSelector('');
    setIsDragging(false);
    setIsExecuting(false);
    setSelectedElements([]);

    const prevSelectedList = document.querySelectorAll('[automa-el-list]');
    prevSelectedList.forEach((element) => {
      element.removeAttribute('automa-el-list');
    });

    document.documentElement.style.fontSize = originalFontSize;
  }, [rootElement]);

  const saveSelector = useCallback(() => {
    if (!connectedPortRef.current) return;
    connectedPortRef.current.postMessage(elSelector);
    clearConnectedPort();
    destroy();
  }, [elSelector, clearConnectedPort, destroy]);

  // Debounced selector update
  const updateSelector = useCallback(
    debounce((selector: string) => {
      let frameSelector: string | undefined;
      let elSel = selector;

      if (selector.includes('|>')) {
        [frameSelector, elSel] = selector.split(/\|>(.+)/);
      }

      const sType = selectorType === 'css' ? 'cssSelector' : 'xpath';

      try {
        if (frameSelector) {
          const frame = (FindElement as any)[sType]({
            selector: frameSelector,
            multiple: false,
          });
          if (!['IFRAME', 'FRAME'].includes(frame.tagName)) return;

          const { top, left } = frame.getBoundingClientRect();
          frame.contentWindow.postMessage(
            {
              selectorType: sType,
              selector: elSel,
              type: 'automa:find-element',
              frameRect: { top, left },
            },
            '*'
          );
          return;
        }

        const elements = (FindElement as any)[sType]({
          selector: elSel,
          multiple: true,
        });
        setSelectedElements(
          Array.from(elements || []).map((el: any) => getElementRect(el, true))
        );
      } catch (error) {
        console.error(error);
        setSelectedElements([]);
      }
    }, 200),
    [selectorType]
  );

  const toggleHighlightElement = useCallback(
    ({ index, highlight }: { index: number; highlight: boolean }) => {
      setSelectedElements((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], highlight };
        return next;
      });
    },
    []
  );

  const onElementsSelected = useCallback(
    ({
      selector,
      elements,
      path,
      selectElements: selElements,
    }: any) => {
      if (path) {
        selectedElementRef.current.path = path;
        selectedElementRef.current.pathIndex = 0;
      }

      setElSelector(selector);
      setSelectedElements(elements || []);
      setSelectElements(selElements || []);
    },
    []
  );

  const selectElementPath = useCallback(
    (type: 'up' | 'down') => {
      const sel = selectedElementRef.current;
      let pathIndex =
        type === 'up' ? sel.pathIndex + 1 : sel.pathIndex - 1;
      let element = sel.path[pathIndex];

      if ((type === 'up' && !element) || element?.tagName === 'BODY') return;

      if (type === 'down' && !element) {
        const previousElement = sel.path[sel.pathIndex];
        const childEl = Array.from(previousElement.children).find(
          (el) => !['STYLE', 'SCRIPT'].includes(el.tagName)
        ) as HTMLElement;

        if (!childEl) return;

        element = childEl;
        sel.path.unshift(childEl);
        pathIndex = 0;
      }

      sel.pathIndex = pathIndex;

      setSelectedElements([getElementRect(element, true)]);
      setElSelector(
        sel.cache.has(element)
          ? sel.cache.get(element)!
          : findSelector(element, getSelectorOptions(selectorSettings))
      );
    },
    [selectorSettings]
  );

  // Mouse move for dragging
  useEffect(() => {
    const onMousemove = (e: MouseEvent) => {
      if (!isDragging) return;

      let { clientX, clientY } = e;
      const height = window.innerHeight;
      const width = document.documentElement.clientWidth;

      if (clientY < 10) clientY = 10;
      else if (cardSize.height + clientY > height)
        clientY = height - cardSize.height;

      if (clientX < 10) clientX = 10;
      else if (cardSize.width + clientX > width) clientX = width - cardSize.width;

      setCardPos({ x: clientX, y: clientY });
    };

    const onMouseup = () => {
      if (isDragging) setIsDragging(false);
    };

    window.addEventListener('mousemove', onMousemove);
    window.addEventListener('mouseup', onMouseup);
    return () => {
      window.removeEventListener('mousemove', onMousemove);
      window.removeEventListener('mouseup', onMouseup);
    };
  }, [isDragging, cardSize]);

  // isDragging body attribute
  useEffect(() => {
    document.body.toggleAttribute('automa-isDragging', isDragging);
  }, [isDragging]);

  // Persist selector settings
  useEffect(() => {
    browser.storage.local.set({ selectorSettings });
  }, [selectorSettings]);

  // Observe card size
  useEffect(() => {
    if (!cardRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      const { height, width } = entry.contentRect;
      setCardSize({ width, height });
    });

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  // Window message handler
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type !== 'automa:selected-elements') return;
      setSelectedElements(e.data.elements);
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Visibility change handler
  useEffect(() => {
    const onVisibilityChange = () => {
      if (!connectedPortRef.current || document.visibilityState !== 'hidden')
        return;
      clearConnectedPort();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [clearConnectedPort]);

  // Runtime port connection
  useEffect(() => {
    const listener = (port: any) => {
      clearConnectedPort();
      connectedPortRef.current = port;
      setIsSelectBlockElement(true);
      port.onDisconnect.addListener(clearConnectedPort);
    };

    browser.runtime.onConnect.addListener(listener);
    return () => browser.runtime.onConnect.removeListener(listener);
  }, [clearConnectedPort]);

  // Init on mount
  useEffect(() => {
    browser.storage.local.get('selectorSettings').then((storage) => {
      const settings = storage.selectorSettings || {};
      setSelectorSettings((prev) => ({ ...prev, ...settings }));
    });

    setTimeout(() => {
      if (!cardRef.current) return;
      const { height, width } = cardRef.current.getBoundingClientRect();

      setCardPos({ x: window.innerWidth - (width + 35), y: 20 });
      setCardSize({ width, height });
    }, 500);
  }, []);

  return (
    <>
      <div
        className={`root pointer-events-none fixed top-0 left-0 h-full w-full text-black ${
          isDragging ? 'select-none' : ''
        } ${!hide ? 'bg-black bg-opacity-30' : ''}`}
        style={{ zIndex: 99999999 }}
      >
        <div
          ref={cardRef}
          style={{
            width: 320,
            transform: `translate(${cardPos.x}px, ${cardPos.y}px)`,
          }}
          className="root-card pointer-events-auto relative z-50 rounded-lg bg-white shadow-xl"
        >
          {/* Drag handle */}
          <div
            className="drag-button absolute z-50 cursor-move rounded-lg bg-white p-2 p-1 shadow-xl"
            style={{ top: -15, left: -15 }}
          >
            <VRemixicon
              name="riDragMoveLine"
              onMouseDown={() => setIsDragging(true)}
            />
          </div>

          {/* Header */}
          <div className="flex items-center px-4 pt-4">
            <p className="text-lg font-semibold">Automa</p>
            <div className="grow" />
            <button
              className="hoverable mr-2 rounded-md p-1 transition"
              onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setHide((prev) => !prev);
                clearConnectedPort();
              }}
            >
              <VRemixicon name={hide ? 'riEyeOffLine' : 'riEyeLine'} />
            </button>
            <button
              className="hoverable rounded-md p-1 transition"
              onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                destroy();
              }}
            >
              <VRemixicon name="riCloseLine" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4">
            <SelectorQuery
              selectorType={selectorType}
              onSelectorTypeChange={setSelectorType}
              selectList={selectList}
              onSelectListChange={setSelectList}
              selector={elSelector}
              settingsActive={showSettings}
              selectedCount={selectedElements.length}
              onSettings={setShowSettings}
              onSelector={updateSelector}
              onParent={() => selectElementPath('up')}
              onChild={() => selectElementPath('down')}
            />

            {isSelectBlockElement && (
              <UiButton
                disabled={!elSelector}
                variant="accent"
                className="mt-4 w-full"
                onClick={saveSelector}
              >
                Select Element
              </UiButton>
            )}

            {!showSettings &&
              !hide &&
              selectedElements.length > 0 && (
                <SelectorElementsDetail
                  activeTab={activeTab}
                  onActiveTabChange={setActiveTab}
                  elSelector={elSelector}
                  selectElements={selectElements}
                  hideBlocks={isSelectBlockElement}
                  selectedElements={selectedElements}
                  onHighlight={toggleHighlightElement}
                  onExecute={setIsExecuting}
                />
              )}

            {showSettings && selectorType === 'css' && !hide && (
              <div className="mt-4">
                <p className="mb-4 font-semibold">Selector settings</p>
                <ul className="space-y-4">
                  <li>
                    <label className="flex items-center space-x-2">
                      <UiSwitch
                        checked={selectorSettings.idName}
                        onChange={(v: boolean) =>
                          updateSelectorSetting('idName', v)
                        }
                      />
                      <p>Include element id</p>
                    </label>
                  </li>
                  <li>
                    <label className="flex items-center space-x-2">
                      <UiSwitch
                        checked={selectorSettings.tagName}
                        onChange={(v: boolean) =>
                          updateSelectorSetting('tagName', v)
                        }
                      />
                      <p>Include tag name</p>
                    </label>
                  </li>
                  <li>
                    <label className="flex items-center space-x-2">
                      <UiSwitch
                        checked={selectorSettings.className}
                        onChange={(v: boolean) =>
                          updateSelectorSetting('className', v)
                        }
                      />
                      <p>Include class name</p>
                    </label>
                  </li>
                  <li>
                    <label className="flex items-center space-x-2">
                      <UiSwitch
                        checked={selectorSettings.attr}
                        onChange={(v: boolean) =>
                          updateSelectorSetting('attr', v)
                        }
                      />
                      <p>Include attributes</p>
                    </label>
                    {selectorSettings.attr && (
                      <>
                        <label
                          className="ml-1 mt-2 block text-sm text-gray-600"
                          htmlFor="automa-attribute-names"
                        >
                          Attribute names
                        </label>
                        <UiTextarea
                          id="automa-attribute-names"
                          value={selectorSettings.attrNames}
                          onChange={(e: any) =>
                            updateSelectorSetting(
                              'attrNames',
                              e.target?.value ?? e
                            )
                          }
                          label="Attribute name"
                          placeholder="data-testid, aria-label, type"
                        />
                        <span className="text-sm">
                          Use commas to separate the attribute
                        </span>
                      </>
                    )}
                  </li>
                </ul>
              </div>
            )}

            <p className="mt-1 text-sm text-gray-600">
              Click or press{' '}
              <kbd className="bg-box-transparent rounded-md p-1">Space</kbd> to
              select an element
            </p>
          </div>
        </div>
      </div>

      <SharedElementSelector
        hide={hide}
        disabled={hide}
        list={selectList}
        selectorType={selectorType}
        selectedEls={selectedElements}
        selectorSettings={selectorSettings}
        withAttributes
        onSelected={onElementsSelected}
      />
    </>
  );
};

export default ElementSelectorApp;
