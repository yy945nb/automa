import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import browser from 'webextension-polyfill';
import { toCamelCase } from '@/utils/helper';
import { tasks } from '@/utils/shared';
import findSelector from '@/lib/findSelector';
import SharedElementSelector from '@/components/content/shared/SharedElementSelector';
import { getElementRect } from '../../utils';
import addBlock from './addBlock';
import VRemixicon from '@/components/VRemixicon';

const blocksList: Record<string, string[]> = {
  IMG: ['save-assets', 'attribute-value'],
  VIDEO: ['save-assets', 'attribute-value'],
  AUDIO: ['save-assets', 'attribute-value'],
  default: ['get-text', 'attribute-value'],
};

const RecordWorkflowApp: React.FC = () => {
  const rootElRef = useRef<HTMLDivElement>(null);

  const [tempListId, setTempListId] = useState('');

  // Select state
  const [listId, setListId] = useState('');
  const [isList, setIsList] = useState(false);
  const [pathIndex, setPathIndex] = useState(0);
  const [status, setStatus] = useState<'idle' | 'selecting'>('idle');
  const [isInList, setIsInList] = useState(false);
  const [listSelector, setListSelector] = useState('');
  const [childSelector, setChildSelector] = useState('');
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedElements, setSelectedElements] = useState<any[]>([]);

  // Dragging state
  const [dragging, setDragging] = useState(false);
  const [xPos, setXPos] = useState(typeof window !== 'undefined' ? window.innerWidth - 300 : 0);
  const [yPos, setYPos] = useState(20);

  // Add block state
  const [blocks, setBlocks] = useState<string[]>([]);
  const [column, setColumn] = useState('');
  const [varName, setVarName] = useState('');
  const [attributes, setAttributes] = useState<any>([]);
  const [activeAttr, setActiveAttr] = useState('');
  const [activeBlock, setActiveBlock] = useState('');
  const [workflowColumns, setWorkflowColumns] = useState<any[]>([]);

  const mouseRelativePos = useRef({ x: 0, y: 0 });
  const elementsPathRef = useRef<{
    path: HTMLElement[];
    cache: WeakMap<HTMLElement, string>;
  }>({
    path: [],
    cache: new WeakMap(),
  });

  const stopRecording = useCallback(() => {
    browser.runtime.sendMessage({ type: 'background--recording:stop' });
  }, []);

  const getElementBlocks = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    const elTag = element.tagName;
    const elBlocks = [...(blocksList[elTag] || blocksList.default)];
    const attrBlockIndex = elBlocks.indexOf('attribute-value');

    if (attrBlockIndex !== -1) {
      setAttributes(element.attributes);
    }

    setBlocks(elBlocks);
  }, []);

  const onElementsSelected = useCallback(
    ({ selector, elements, path }: any) => {
      if (path) {
        elementsPathRef.current.path = path;
        setPathIndex(0);
      }

      getElementBlocks(elements?.[0]);
      setSelectedElements(elements || []);

      if (isList) {
        if (!listSelector) {
          setIsInList(false);
          setListSelector(selector);
          setChildSelector(selector);
          return;
        }

        setIsInList(true);
        selector = selector.replace(listSelector, '');
      }

      setChildSelector(selector);
    },
    [isList, listSelector, getElementBlocks]
  );

  const clearSelectState = useCallback(() => {
    if (isList && listId) {
      addBlock({
        id: 'loop-breakpoint',
        description: listId,
        data: { loopId: listId },
      });
    }

    setListId('');
    setIsList(false);
    setStatus('idle');
    setListSelector('');
    setChildSelector('');
    setIsSelecting(false);
    setSelectedElements([]);

    const selectedList = document.querySelectorAll('[automa-el-list]');
    selectedList.forEach((element) => {
      element.removeAttribute('automa-el-list');
    });

    const frameElements = document.querySelectorAll('iframe, frame');
    frameElements.forEach((element) => {
      (element as HTMLIFrameElement).contentWindow?.postMessage(
        { type: 'automa:reset-element-selector' },
        '*'
      );
    });

    document.body.removeAttribute('automa-selecting');
  }, [isList, listId]);

  const addFlowItem = useCallback(() => {
    const saveData = Boolean(column);
    const assignVariable = Boolean(varName);
    const block: any = {
      id: activeBlock,
      data: {
        saveData,
        assignVariable,
        waitForSelector: true,
        dataColumn: column,
        variableName: varName,
        selector: isList ? listSelector : childSelector,
      },
    };

    if (isList) {
      if (isInList || listId) {
        const cSelector = isInList ? childSelector : '';
        block.data.selector = `{{loopData@${listId}}} ${cSelector}`;
      } else {
        block.data.multiple = true;
      }
    }

    if (activeBlock === 'attribute-value') {
      block.data.attributeName = activeAttr;
    }

    addBlock(block).then(() => {
      setColumn('');
      setVarName('');
      setActiveAttr('');
    });
  }, [column, varName, activeBlock, isList, listSelector, childSelector, isInList, listId, activeAttr]);

  const selectElementPath = useCallback(
    (type: 'up' | 'down') => {
      const ep = elementsPathRef.current;
      let newPathIndex = type === 'up' ? pathIndex + 1 : pathIndex - 1;
      let element = ep.path[newPathIndex];

      if ((type === 'up' && !element) || element?.tagName === 'BODY') return;

      if (type === 'down' && !element) {
        const previousElement = ep.path[pathIndex];
        const childEl = Array.from(previousElement.children).find(
          (el) => !['STYLE', 'SCRIPT'].includes(el.tagName)
        ) as HTMLElement;

        if (!childEl) return;

        element = childEl;
        ep.path.unshift(childEl);
        newPathIndex = 0;
      }

      setPathIndex(newPathIndex);
      setSelectedElements([getElementRect(element)]);
      setChildSelector(
        ep.cache.has(element)
          ? ep.cache.get(element)!
          : findSelector(element)
      );
    },
    [pathIndex]
  );

  const saveElementListId = useCallback(() => {
    if (!tempListId) return;

    const camelId = toCamelCase(tempListId);
    setListId(camelId);
    setTempListId('');

    addBlock({
      id: 'loop-data',
      description: camelId,
      data: {
        loopThrough: 'elements',
        loopId: camelId,
        elementSelector: listSelector,
      },
    });
  }, [tempListId, listSelector]);

  const toggleDragging = useCallback(
    (value: boolean, event?: React.MouseEvent) => {
      if (value && event && rootElRef.current) {
        const bounds = rootElRef.current.getBoundingClientRect();
        mouseRelativePos.current = {
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        };
      } else {
        mouseRelativePos.current = { x: 0, y: 0 };
      }

      setDragging(value);
    },
    []
  );

  const startSelecting = useCallback((list = false) => {
    setIsList(list);
    setIsSelecting(true);
    setStatus('selecting');
    document.body.setAttribute('automa-selecting', '');
  }, []);

  // Reset add block state when selectedElements changes
  useEffect(() => {
    setColumn('');
    setVarName('');
    setActiveBlock('');
  }, [selectedElements]);

  // Mouse move for dragging
  useEffect(() => {
    const onMousemove = (e: MouseEvent) => {
      if (!dragging) return;
      setXPos(e.clientX - mouseRelativePos.current.x);
      setYPos(e.clientY - mouseRelativePos.current.y);
    };

    window.addEventListener('mousemove', onMousemove);
    return () => window.removeEventListener('mousemove', onMousemove);
  }, [dragging]);

  // Keyup for escape
  useEffect(() => {
    if (status !== 'selecting') return;

    const onKeyup = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      clearSelectState();
    };

    window.addEventListener('keyup', onKeyup);
    return () => window.removeEventListener('keyup', onKeyup);
  }, [status, clearSelectState]);

  // Init on mount
  useEffect(() => {
    browser.storage.local
      .get(['recording', 'workflows'])
      .then(({ recording, workflows }) => {
        const workflow = Object.values(workflows || {}).find(
          ({ id }: any) => recording?.workflowId === id
        );
        setWorkflowColumns((workflow as any)?.table || []);
      });
  }, []);

  const parentSelector = listSelector; // alias for readability

  return (
    <>
      <div
        ref={rootElRef}
        className="content fixed top-0 left-0 overflow-hidden rounded-lg bg-white text-black shadow-xl"
        style={{
          zIndex: 99999999,
          fontSize: 16,
          transform: `translate(${xPos}px, ${yPos}px)`,
        }}
      >
        {/* Draggable header */}
        <div
          className={`hoverable flex select-none items-center px-4 py-2 transition ${
            dragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          onMouseUp={(e) => toggleDragging(false, e)}
          onMouseDown={(e) => toggleDragging(true, e)}
        >
          <span
            className="relative flex cursor-pointer items-center justify-center rounded-full bg-red-400"
            style={{ height: 24, width: 24 }}
            title="Stop recording"
            onClick={stopRecording}
          >
            <VRemixicon
              name="riRecordCircleLine"
              className="relative z-10"
              size={20}
            />
            <span
              className="absolute animate-ping rounded-full bg-red-400"
              style={{ height: '80%', width: '80%', animationDuration: '1.3s' }}
            />
          </span>
          <p className="ml-2 font-semibold">Automa</p>
          <div className="grow" />
          <VRemixicon name="mdiDragHorizontal" />
        </div>

        {/* Body */}
        <div className="p-4">
          {status === 'idle' ? (
            <>
              <button
                className="bg-input w-full rounded-lg px-4 py-2 transition"
                onClick={() => startSelecting(false)}
              >
                Select element
              </button>
              <button
                className="bg-input mt-2 w-full rounded-lg px-4 py-2 transition"
                onClick={() => startSelecting(true)}
              >
                Select list element
              </button>
            </>
          ) : status === 'selecting' ? (
            <div className="leading-tight">
              {selectedElements.length === 0 ? (
                <p>Select an element by clicking on it</p>
              ) : (
                <>
                  {isList && !listId ? (
                    <>
                      <label
                        htmlFor="list-id"
                        className="ml-1"
                        style={{ fontSize: 14 }}
                      >
                        Element list id
                      </label>
                      <input
                        id="list-id"
                        value={tempListId}
                        onChange={(e) => setTempListId(e.target.value)}
                        placeholder="listId"
                        className="bg-input w-full rounded-lg px-4 py-2"
                        onKeyUp={(e) => {
                          if (e.key === 'Enter') saveElementListId();
                        }}
                      />
                      <button
                        className={`mt-2 w-full rounded-lg bg-accent px-4 py-2 text-white ${
                          !tempListId ? 'opacity-75 pointer-events-none' : ''
                        }`}
                        onClick={saveElementListId}
                      >
                        Save
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex w-full items-center space-x-2">
                        <input
                          value={childSelector || parentSelector}
                          className="bg-input w-full rounded-lg px-4 py-2"
                          readOnly
                        />
                        {!isList && !childSelector.includes('|>') && (
                          <>
                            <button onClick={() => selectElementPath('up')}>
                              <VRemixicon
                                name="riArrowLeftLine"
                                rotate={90}
                              />
                            </button>
                            <button onClick={() => selectElementPath('down')}>
                              <VRemixicon
                                name="riArrowLeftLine"
                                rotate={-90}
                              />
                            </button>
                          </>
                        )}
                      </div>
                      <select
                        value={activeBlock}
                        onChange={(e) => setActiveBlock(e.target.value)}
                        className="bg-input mt-2 w-full rounded-lg px-4 py-2"
                      >
                        <option value="" disabled>
                          Select what to do
                        </option>
                        {blocks.map((block) => (
                          <option key={block} value={block}>
                            {(tasks as any)[block]?.name}
                          </option>
                        ))}
                      </select>

                      {['get-text', 'attribute-value'].includes(activeBlock) && (
                        <>
                          {activeBlock === 'attribute-value' && (
                            <select
                              value={activeAttr}
                              onChange={(e) => setActiveAttr(e.target.value)}
                              className="bg-input mt-2 block w-full rounded-lg px-4 py-2"
                            >
                              <option value="" disabled>
                                Select attribute
                              </option>
                              {Array.from(attributes).map((attr: any) => (
                                <option key={attr.name} value={attr.name}>
                                  {attr.name}(
                                  {attr.value?.slice(0, 64)})
                                </option>
                              ))}
                            </select>
                          )}
                          <label
                            htmlFor="variable-name"
                            className="ml-2 mt-2 text-sm text-gray-600"
                          >
                            Assign to variable
                          </label>
                          <input
                            id="variable-name"
                            value={varName}
                            onChange={(e) => setVarName(e.target.value)}
                            placeholder="Variable name"
                            className="bg-input w-full rounded-lg px-4 py-2"
                          />
                          <label
                            htmlFor="select-column"
                            className="ml-2 mt-2 text-sm text-gray-600"
                          >
                            Insert to table
                          </label>
                          <select
                            id="select-column"
                            value={column}
                            onChange={(e) => setColumn(e.target.value)}
                            className="bg-input block w-full rounded-lg px-4 py-2"
                          >
                            <option value="">Select column [none]</option>
                            {workflowColumns.map((col: any) => (
                              <option key={col.id} value={col.id}>
                                {col.name}
                              </option>
                            ))}
                          </select>
                        </>
                      )}

                      {activeBlock && (
                        <button
                          className={`mt-4 block w-full rounded-lg bg-accent px-4 py-2 text-white ${
                            activeBlock === 'attribute-value' && !activeAttr
                              ? 'pointer-events-none opacity-75'
                              : ''
                          }`}
                          onClick={addFlowItem}
                        >
                          Save
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
              <p className="mt-4" style={{ fontSize: 14 }}>
                Press{' '}
                <kbd className="bg-box-transparent rounded-md p-1">Esc</kbd> to
                cancel
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {isSelecting && (
        <SharedElementSelector
          selectedEls={selectedElements}
          withAttributes
          onlyInList
          list={isList}
          pause={
            selectedElements.length > 0 && isList && !listId
          }
          onSelected={onElementsSelected}
        />
      )}
    </>
  );
};

export default RecordWorkflowApp;
