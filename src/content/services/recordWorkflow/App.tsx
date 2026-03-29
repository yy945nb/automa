import React, { useState, useEffect, useRef, useCallback } from 'react';
import browser from 'webextension-polyfill';
import { toCamelCase } from '@/utils/helper';
import { tasks } from '@/utils/shared';
import findSelector from '@/lib/findSelector';
import SharedElementSelector from '@/components/content/shared/SharedElementSelector';
import { getElementRect } from '../../utils';
import addBlock from './addBlock';

interface DraggingState {
  dragging: boolean;
  xPos: number;
  yPos: number;
}

interface SelectState {
  listId: string;
  list: boolean;
  pathIndex: number;
  status: 'idle' | 'selecting';
  isInList: boolean;
  listSelector: string;
  childSelector: string;
  parentSelector: string;
  isSelecting: boolean;
  selectedElements: any[];
}

interface AddBlockState {
  blocks: string[];
  column: string;
  varName: string;
  attributes: NamedNodeMap | any[];
  activeAttr: string;
  activeBlock: string;
  workflowColumns: any[];
}

const mouseRelativePos = { x: 0, y: 0 };
const elementsPath = {
  path: [] as Element[],
  cache: new WeakMap<Element, string>(),
};

const MAX_ATTRIBUTE_DISPLAY_LENGTH = 64;

const blocksList: Record<string, string[]> = {
  IMG: ['save-assets', 'attribute-value'],
  VIDEO: ['save-assets', 'attribute-value'],
  AUDIO: ['save-assets', 'attribute-value'],
  default: ['get-text', 'attribute-value'],
};

export default function App() {
  const rootElRef = useRef<HTMLDivElement>(null);
  const [tempListId, setTempListId] = useState('');

  const [selectState, setSelectState] = useState<SelectState>({
    listId: '',
    list: false,
    pathIndex: 0,
    status: 'idle',
    isInList: false,
    listSelector: '',
    childSelector: '',
    parentSelector: '',
    isSelecting: false,
    selectedElements: [],
  });

  const [draggingState, setDraggingState] = useState<DraggingState>({
    dragging: false,
    xPos: typeof window !== 'undefined' ? window.innerWidth - 300 : 0,
    yPos: 20,
  });

  const [addBlockState, setAddBlockState] = useState<AddBlockState>({
    blocks: [],
    column: '',
    varName: '',
    attributes: [],
    activeAttr: '',
    activeBlock: '',
    workflowColumns: [],
  });

  function stopRecording() {
    browser.runtime.sendMessage({ type: 'background--recording:stop' });
  }

  function getElementBlocks(element: Element | undefined) {
    if (!element) return;
    const elTag = element.tagName;
    const blocks = [...(blocksList[elTag] || blocksList.default)];
    const attrBlockIndex = blocks.indexOf('attribute-value');
    if (attrBlockIndex !== -1) {
      setAddBlockState((prev) => ({ ...prev, attributes: element.attributes, blocks }));
    } else {
      setAddBlockState((prev) => ({ ...prev, blocks }));
    }
  }

  function onElementsSelected({
    selector,
    elements,
    path,
  }: {
    selector: string;
    elements: any[];
    path?: Element[];
  }) {
    if (path) {
      elementsPath.path = path;
      setSelectState((prev) => ({ ...prev, pathIndex: 0 }));
    }

    getElementBlocks(elements[0]);

    setSelectState((prev) => {
      let childSelector = selector;

      if (prev.list) {
        if (!prev.listSelector) {
          return {
            ...prev,
            isInList: false,
            listSelector: selector,
            childSelector: selector,
            selectedElements: elements,
          };
        }
        const isInList = true;
        childSelector = selector.replace(prev.listSelector, '');
        return { ...prev, isInList, childSelector, selectedElements: elements };
      }

      return { ...prev, childSelector, selectedElements: elements };
    });
  }

  function addFlowItem() {
    const saveData = Boolean(addBlockState.column);
    const assignVariable = Boolean(addBlockState.varName);
    const block: any = {
      id: addBlockState.activeBlock,
      data: {
        saveData,
        assignVariable,
        waitForSelector: true,
        dataColumn: addBlockState.column,
        variableName: addBlockState.varName,
        selector: selectState.list
          ? selectState.listSelector
          : selectState.childSelector,
      },
    };

    if (selectState.list) {
      if (selectState.isInList || selectState.listId) {
        const childSelector = selectState.isInList ? selectState.childSelector : '';
        block.data.selector = `{{loopData@${selectState.listId}}} ${childSelector}`;
      } else {
        block.data.multiple = true;
      }
    }

    if (addBlockState.activeBlock === 'attribute-value') {
      block.data.attributeName = addBlockState.activeAttr;
    }

    addBlock(block).then(() => {
      setAddBlockState((prev) => ({ ...prev, column: '', varName: '', activeAttr: '' }));
    });
  }

  function selectElementPath(type: 'up' | 'down') {
    setSelectState((prev) => {
      let pathIndex =
        type === 'up' ? prev.pathIndex + 1 : prev.pathIndex - 1;
      let element = elementsPath.path[pathIndex];

      if ((type === 'up' && !element) || element?.tagName === 'BODY') return prev;

      if (type === 'down' && !element) {
        const previousElement = elementsPath.path[prev.pathIndex];
        const childEl = Array.from(previousElement.children).find(
          (el) => !['STYLE', 'SCRIPT'].includes(el.tagName)
        );
        if (!childEl) return prev;
        element = childEl;
        elementsPath.path.unshift(childEl);
        pathIndex = 0;
      }

      const childSelector = elementsPath.cache.has(element)
        ? elementsPath.cache.get(element)!
        : findSelector(element);

      return {
        ...prev,
        pathIndex,
        selectedElements: [getElementRect(element)],
        childSelector,
      };
    });
  }

  function clearSelectState() {
    setSelectState((prev) => {
      if (prev.list && prev.listId) {
        addBlock({
          id: 'loop-breakpoint',
          description: prev.listId,
          data: { loopId: prev.listId },
        });
      }
      return {
        listId: '',
        list: false,
        pathIndex: 0,
        status: 'idle',
        isInList: false,
        listSelector: '',
        childSelector: '',
        parentSelector: '',
        isSelecting: false,
        selectedElements: [],
      };
    });

    const selectedList = document.querySelectorAll('[automa-el-list]');
    selectedList.forEach((el) => el.removeAttribute('automa-el-list'));

    const frameElements = document.querySelectorAll('iframe, frame');
    frameElements.forEach((el) => {
      (el as HTMLIFrameElement).contentWindow?.postMessage(
        { type: 'automa:reset-element-selector' },
        '*'
      );
    });

    document.body.removeAttribute('automa-selecting');
  }

  function saveElementListId() {
    if (!tempListId) return;
    const listId = toCamelCase(tempListId);
    setTempListId('');
    setSelectState((prev) => ({ ...prev, listId }));

    addBlock({
      id: 'loop-data',
      description: listId,
      data: {
        loopThrough: 'elements',
        loopId: listId,
        elementSelector: selectState.listSelector,
      },
    });
  }

  function toggleDragging(value: boolean, event?: React.MouseEvent<HTMLDivElement>) {
    if (value && event && rootElRef.current) {
      const bounds = rootElRef.current.getBoundingClientRect();
      mouseRelativePos.x = event.clientX - bounds.left;
      mouseRelativePos.y = event.clientY - bounds.top;
    } else {
      mouseRelativePos.x = 0;
      mouseRelativePos.y = 0;
    }
    setDraggingState((prev) => ({ ...prev, dragging: value }));
  }

  const onKeyup = useCallback(
    ({ key }: KeyboardEvent) => {
      if (key !== 'Escape') return;
      clearSelectState();
      window.removeEventListener('keyup', onKeyup);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  function startSelecting(list = false) {
    setSelectState((prev) => ({
      ...prev,
      list,
      isSelecting: true,
      status: 'selecting',
    }));
    document.body.setAttribute('automa-selecting', '');
    window.addEventListener('keyup', onKeyup);
  }

  useEffect(() => {
    function onMousemove({ clientX, clientY }: MouseEvent) {
      if (!draggingState.dragging) return;
      setDraggingState((prev) => ({
        ...prev,
        xPos: clientX - mouseRelativePos.x,
        yPos: clientY - mouseRelativePos.y,
      }));
    }

    window.addEventListener('mousemove', onMousemove);
    return () => window.removeEventListener('mousemove', onMousemove);
  }, [draggingState.dragging]);

  // Reset addBlockState when selectedElements change
  useEffect(() => {
    setAddBlockState((prev) => ({ ...prev, column: '', varName: '', activeBlock: '' }));
  }, [selectState.selectedElements]);

  useEffect(() => {
    browser.storage.local
      .get(['recording', 'workflows'])
      .then(({ recording, workflows }: any) => {
        const workflow = Object.values(workflows as Record<string, any>).find(
          ({ id }) => recording.workflowId === id
        );
        setAddBlockState((prev) => ({ ...prev, workflowColumns: workflow?.table || [] }));
      });

    return () => {
      window.removeEventListener('keyup', onKeyup);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tasksList = tasks as Record<string, { name: string }>;
  const selectorValue = selectState.childSelector || selectState.parentSelector;

  return (
    <>
      <div
        ref={rootElRef}
        className="content fixed top-0 left-0 overflow-hidden rounded-lg bg-white text-black shadow-xl"
        style={{
          zIndex: 99999999,
          fontSize: 16,
          transform: `translate(${draggingState.xPos}px, ${draggingState.yPos}px)`,
        }}
      >
        {/* Drag bar */}
        <div
          className={`hoverable flex select-none items-center px-4 py-2 transition ${
            draggingState.dragging ? 'cursor-grabbing' : 'cursor-grab'
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
            <i className="ri-record-circle-line relative z-10 text-white" style={{ fontSize: 20 }} />
            <span
              className="absolute animate-ping rounded-full bg-red-400"
              style={{ height: '80%', width: '80%', animationDuration: '1.3s' }}
            />
          </span>
          <p className="ml-2 font-semibold">Automa</p>
          <div className="grow" />
          <i className="mdi-drag-horizontal" />
        </div>

        {/* Body */}
        <div className="p-4">
          {selectState.status === 'idle' && (
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
          )}

          {selectState.status === 'selecting' && (
            <div className="leading-tight">
              {selectState.selectedElements.length === 0 ? (
                <p>Select an element by clicking on it</p>
              ) : (
                <>
                  {selectState.list && !selectState.listId ? (
                    <>
                      <label htmlFor="list-id" className="ml-1" style={{ fontSize: 14 }}>
                        Element list id
                      </label>
                      <input
                        id="list-id"
                        value={tempListId}
                        placeholder="listId"
                        className="bg-input w-full rounded-lg px-4 py-2"
                        onChange={(e) => setTempListId(e.target.value)}
                        onKeyUp={(e) => { if (e.key === 'Enter') saveElementListId(); }}
                      />
                      <button
                        className={`mt-2 w-full rounded-lg bg-accent px-4 py-2 text-white${!tempListId ? ' pointer-events-none opacity-75' : ''}`}
                        onClick={saveElementListId}
                      >
                        Save
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex w-full items-center space-x-2">
                        <input
                          value={selectorValue}
                          className="bg-input w-full rounded-lg px-4 py-2"
                          readOnly
                        />
                        {!selectState.list && !selectState.childSelector.includes('|>') && (
                          <>
                            <button onClick={() => selectElementPath('up')}>
                              <i className="ri-arrow-left-line" style={{ transform: 'rotate(90deg)' }} />
                            </button>
                            <button onClick={() => selectElementPath('down')}>
                              <i className="ri-arrow-left-line" style={{ transform: 'rotate(-90deg)' }} />
                            </button>
                          </>
                        )}
                      </div>

                      <select
                        value={addBlockState.activeBlock}
                        className="bg-input mt-2 w-full rounded-lg px-4 py-2"
                        onChange={(e) =>
                          setAddBlockState((prev) => ({ ...prev, activeBlock: e.target.value }))
                        }
                      >
                        <option value="" disabled>Select what to do</option>
                        {addBlockState.blocks.map((block) => (
                          <option key={block} value={block}>
                            {tasksList[block]?.name}
                          </option>
                        ))}
                      </select>

                      {['get-text', 'attribute-value'].includes(addBlockState.activeBlock) && (
                        <>
                          {addBlockState.activeBlock === 'attribute-value' && (
                            <select
                              value={addBlockState.activeAttr}
                              className="bg-input mt-2 block w-full rounded-lg px-4 py-2"
                              onChange={(e) =>
                                setAddBlockState((prev) => ({ ...prev, activeAttr: e.target.value }))
                              }
                            >
                              <option value="" disabled>Select attribute</option>
                              {Object.entries(addBlockState.attributes as Record<string, string>).map(
                                ([name, value]) => (
                                  <option key={name} value={name}>
                                    {name}({String(value).slice(0, MAX_ATTRIBUTE_DISPLAY_LENGTH)})
                                  </option>
                                )
                              )}
                            </select>
                          )}

                          <label htmlFor="variable-name" className="ml-2 mt-2 text-sm text-gray-600">
                            Assign to variable
                          </label>
                          <input
                            id="variable-name"
                            value={addBlockState.varName}
                            placeholder="Variable name"
                            className="bg-input w-full rounded-lg px-4 py-2"
                            onChange={(e) =>
                              setAddBlockState((prev) => ({ ...prev, varName: e.target.value }))
                            }
                          />

                          <label htmlFor="select-column" className="ml-2 mt-2 text-sm text-gray-600">
                            Insert to table
                          </label>
                          <select
                            id="select-column"
                            value={addBlockState.column}
                            className="bg-input block w-full rounded-lg px-4 py-2"
                            onChange={(e) =>
                              setAddBlockState((prev) => ({ ...prev, column: e.target.value }))
                            }
                          >
                            <option value="">Select column [none]</option>
                            {addBlockState.workflowColumns.map((col: any) => (
                              <option key={col.id} value={col.id}>
                                {col.name}
                              </option>
                            ))}
                          </select>
                        </>
                      )}

                      {addBlockState.activeBlock && (
                        <button
                          className={`mt-4 block w-full rounded-lg bg-accent px-4 py-2 text-white${
                            addBlockState.activeBlock === 'attribute-value' && !addBlockState.activeAttr
                              ? ' pointer-events-none opacity-75'
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
                Press <kbd className="bg-box-transparent rounded-md p-1">Esc</kbd> to cancel
              </p>
            </div>
          )}
        </div>
      </div>

      {selectState.isSelecting && (
        <SharedElementSelector
          selectedEls={selectState.selectedElements}
          withAttributes
          onlyInList
          list={selectState.list}
          pause={
            selectState.selectedElements.length > 0 &&
            selectState.list &&
            !selectState.listId
          }
          onSelected={onElementsSelected}
        />
      )}
    </>
  );
}
