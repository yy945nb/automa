import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import browser from 'webextension-polyfill';
import SelectorQuery from '@/components/content/selector/SelectorQuery';
import SelectorElementsDetail from '@/components/content/selector/SelectorElementsDetail';
import SharedElementSelector from '@/components/content/shared/SharedElementSelector';
import UiButton from '@/components/ui/UiButton';
import UiSwitch from '@/components/ui/UiSwitch';
import UiTextarea from '@/components/ui/UiTextarea';
import findSelector from '@/lib/findSelector';
import FindElement from '@/utils/FindElement';
import { debounce } from '@/utils/helper';
import { getElementRect } from '../utils';
import getSelectorOptions from './getSelectorOptions';

interface CardRect {
  x: number;
  y: number;
  height: number;
  width: number;
}

interface SelectorSettings {
  idName: boolean;
  tagName: boolean;
  attr: boolean;
  className: boolean;
  attrNames: string;
}

const CARD_RECT_INIT_DELAY_MS = 500;

let connectedPort: browser.Runtime.Port | null = null;
const originalFontSize = document.documentElement.style.fontSize;
const selectedElement = {
  path: [] as Element[],
  pathIndex: 0,
  cache: new WeakMap<Element, string>(),
};

interface AppProps {
  rootElement?: HTMLElement;
}

export default function App({ rootElement }: AppProps) {
  const [hide, setHide] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [elSelector, setElSelector] = useState('');
  const [selectList, setSelectList] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectElements, setSelectElements] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [selectorType, setSelectorType] = useState('css');
  const [selectedElements, setSelectedElements] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('attributes');
  const [isSelectBlockElement, setIsSelectBlockElement] = useState(false);

  const [cardRect, setCardRect] = useState<CardRect>({ x: 0, y: 0, height: 0, width: 0 });
  const [selectorSettings, setSelectorSettings] = useState<SelectorSettings>({
    idName: true,
    tagName: true,
    attr: true,
    className: true,
    attrNames: 'data-testid',
  });

  const cardRef = useRef<HTMLDivElement>(null);

  // Debounced selector updater
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateSelector = useCallback(
    debounce((selector: string) => {
      let frameSelector: string | undefined;
      let elSel = selector;

      if (selector.includes('|>')) {
        [frameSelector, elSel] = selector.split(/\|>(.+)/);
      }

      const selType = selectorType === 'css' ? 'cssSelector' : 'xpath';

      try {
        if (frameSelector) {
          const frame = (FindElement as any)[selType]({ selector: frameSelector, multiple: false });
          if (!['IFRAME', 'FRAME'].includes(frame.tagName)) return;
          const { top, left } = frame.getBoundingClientRect();
          frame.contentWindow!.postMessage(
            { selType, selector: elSel, type: 'automa:find-element', frameRect: { top, left } },
            '*'
          );
          return;
        }

        const elements = (FindElement as any)[selType]({ selector: elSel, multiple: true });
        setSelectedElements(Array.from(elements || []).map((el) => getElementRect(el as Element, true)));
      } catch (error) {
        console.error(error);
        setSelectedElements([]);
      }
    }, 200),
    [selectorType]
  );

  function toggleHighlightElement({ index, highlight }: { index: number; highlight: boolean }) {
    setSelectedElements((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], highlight };
      return next;
    });
  }

  function onElementsSelected({
    selector,
    elements,
    path,
    selectElements: selElems,
  }: {
    selector: string;
    elements?: any[];
    path?: Element[];
    selectElements?: any[];
  }) {
    if (path) {
      selectedElement.path = path;
      selectedElement.pathIndex = 0;
    }
    setElSelector(selector);
    setSelectedElements(elements || []);
    setSelectElements(selElems || []);
  }

  function onMousemove({ clientX, clientY }: MouseEvent) {
    if (!isDragging) return;

    const height = window.innerHeight;
    const width = document.documentElement.clientWidth;

    let x = clientX;
    let y = clientY;

    if (y < 10) y = 10;
    else if (cardRect.height + y > height) y = height - cardRect.height;

    if (x < 10) x = 10;
    else if (cardRect.width + x > width) x = width - cardRect.width;

    setCardRect((prev) => ({ ...prev, x, y }));
  }

  function selectElementPath(type: 'up' | 'down') {
    let pathIndex =
      type === 'up' ? selectedElement.pathIndex + 1 : selectedElement.pathIndex - 1;
    let element = selectedElement.path[pathIndex];

    if ((type === 'up' && !element) || element?.tagName === 'BODY') return;

    if (type === 'down' && !element) {
      const previousElement = selectedElement.path[selectedElement.pathIndex];
      const childEl = Array.from(previousElement.children).find(
        (el) => !['STYLE', 'SCRIPT'].includes(el.tagName)
      );
      if (!childEl) return;

      element = childEl;
      selectedElement.path.unshift(childEl);
      pathIndex = 0;
    }

    selectedElement.pathIndex = pathIndex;
    setSelectedElements([getElementRect(element, true)]);
    const cached = selectedElement.cache.has(element)
      ? selectedElement.cache.get(element)!
      : findSelector(element, getSelectorOptions(selectorSettings));
    setElSelector(cached);
  }

  function onMouseup() {
    setIsDragging(false);
  }

  function onMessage({ data }: MessageEvent) {
    if (data.type !== 'automa:selected-elements') return;
    setSelectedElements(data.elements);
  }

  function clearConnectedPort() {
    connectedPort = null;
    setIsSelectBlockElement(false);
  }

  function destroy() {
    if (rootElement) rootElement.style.display = 'none';

    setHide(true);
    setActiveTab('');
    setElSelector('');
    setIsDragging(false);
    setIsExecuting(false);
    setSelectedElements([]);

    const prevSelectedList = document.querySelectorAll('[automa-el-list]');
    prevSelectedList.forEach((el) => el.removeAttribute('automa-el-list'));

    document.documentElement.style.fontSize = originalFontSize;
  }

  function onVisibilityChange() {
    if (!connectedPort || document.visibilityState !== 'hidden') return;
    clearConnectedPort();
  }

  function saveSelector() {
    if (!connectedPort) return;
    connectedPort.postMessage(elSelector);
    clearConnectedPort();
    destroy();
  }

  useEffect(() => {
    document.addEventListener('mouseup', onMouseup);
    window.addEventListener('message', onMessage);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('mouseup', onMouseup);
      window.removeEventListener('message', onMessage);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMousemove);
    return () => window.removeEventListener('mousemove', onMousemove);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, cardRect.height, cardRect.width]);

  useEffect(() => {
    document.body.toggleAttribute('automa-isDragging', isDragging);
  }, [isDragging]);

  useEffect(() => {
    browser.storage.local.set({ selectorSettings });
  }, [selectorSettings]);

  useEffect(() => {
    browser.storage.local.get('selectorSettings').then((storage: any) => {
      const settings = storage.selectorSettings || {};
      setSelectorSettings((prev) => ({ ...prev, ...settings }));
    });

    setTimeout(() => {
      if (!cardRef.current) return;
      const { height, width } = cardRef.current.getBoundingClientRect();
      setCardRect({
        x: window.innerWidth - (width + 35),
        y: 20,
        height,
        width,
      });
    }, CARD_RECT_INIT_DELAY_MS);

    // Listen for port connections
    const portListener = (port: browser.Runtime.Port) => {
      clearConnectedPort();
      connectedPort = port;
      setIsSelectBlockElement(true);
      port.onDisconnect.addListener(clearConnectedPort);
    };

    browser.runtime.onConnect.addListener(portListener);
    return () => {
      browser.runtime.onConnect.removeListener(portListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSettingChange = <K extends keyof SelectorSettings>(
    key: K,
    value: SelectorSettings[K]
  ) => {
    setSelectorSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <div
        className={`root pointer-events-none fixed top-0 left-0 h-full w-full text-black${isDragging ? ' select-none' : ''}${!hide ? ' bg-black bg-opacity-30' : ''}`}
        style={{ zIndex: 99999999 }}
      >
        <div
          ref={cardRef}
          className="root-card pointer-events-auto relative z-50 rounded-lg bg-white shadow-xl"
          style={{ width: 320, transform: `translate(${cardRect.x}px, ${cardRect.y}px)` }}
        >
          {/* Drag handle */}
          <div
            className="drag-button absolute z-50 cursor-move rounded-lg bg-white p-1 shadow-xl"
            style={{ top: -15, left: -15 }}
            onMouseDown={() => setIsDragging(true)}
          >
            <i className="ri-drag-move-line" />
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
                setHide((v) => !v);
                clearConnectedPort();
              }}
            >
              <i className={hide ? 'ri-eye-off-line' : 'ri-eye-line'} />
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
              <i className="ri-close-line" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4">
            <SelectorQuery
              selectorType={selectorType}
              selector={elSelector}
              selectList={selectList}
              settingsActive={showSettings}
              selectedCount={selectedElements.length}
              onSelectorTypeChange={setSelectorType}
              onSelectListChange={setSelectList}
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

            {!showSettings && !hide && selectedElements.length > 0 && (
              <SelectorElementsDetail
                activeTab={activeTab}
                elSelector={elSelector}
                selectElements={selectElements}
                hideBlocks={isSelectBlockElement}
                selectedElements={selectedElements}
                onActiveTabChange={setActiveTab}
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
                        modelValue={selectorSettings.idName}
                        onChange={(v) => handleSettingChange('idName', Boolean(v))}
                      />
                      <p>Include element id</p>
                    </label>
                  </li>
                  <li>
                    <label className="flex items-center space-x-2">
                      <UiSwitch
                        modelValue={selectorSettings.tagName}
                        onChange={(v) => handleSettingChange('tagName', Boolean(v))}
                      />
                      <p>Include tag name</p>
                    </label>
                  </li>
                  <li>
                    <label className="flex items-center space-x-2">
                      <UiSwitch
                        modelValue={selectorSettings.className}
                        onChange={(v) => handleSettingChange('className', Boolean(v))}
                      />
                      <p>Include class name</p>
                    </label>
                  </li>
                  <li>
                    <label className="flex items-center space-x-2">
                      <UiSwitch
                        modelValue={selectorSettings.attr}
                        onChange={(v) => handleSettingChange('attr', Boolean(v))}
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
                          modelValue={selectorSettings.attrNames}
                          label="Attribute name"
                          placeholder="data-testid, aria-label, type"
                          onChange={(v) => handleSettingChange('attrNames', String(v))}
                        />
                        <span className="text-sm">Use commas to separate the attribute</span>
                      </>
                    )}
                  </li>
                </ul>
              </div>
            )}

            <p className="mt-1 text-sm text-gray-600">
              Click or press{' '}
              <kbd className="bg-box-transparent rounded-md p-1">Space</kbd> to select an element
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
}
