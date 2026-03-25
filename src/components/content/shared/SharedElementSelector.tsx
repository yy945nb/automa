import React, { useEffect, useRef, useState } from 'react';
// TODO: import { finder } from '@medv/finder'
// TODO: import { debounce } from '@/utils/helper'
// TODO: import getSelectorOptions from '@/content/elementSelector/getSelectorOptions'
// TODO: import { generateXPath, getElementPath, getElementRect } from '@/content/utils'
// TODO: import findElementList from '@/content/elementSelector/listSelector'
// TODO: import generateElementsSelector from '@/content/elementSelector/generateElementsSelector'
import SharedElementHighlighter from './SharedElementHighlighter';

interface ElementsState {
  hovered: any[];
  selected: any[];
}

interface SelectedPayload {
  selector: string;
  elements: any[];
  selectElements?: any[];
  path?: string;
}

interface SharedElementSelectorProps {
  selectorType?: string;
  selectedEls?: any[];
  selectorSettings?: Record<string, any>;
  list?: boolean;
  hide?: boolean;
  pause?: boolean;
  disabled?: boolean;
  onlyInList?: boolean;
  withAttributes?: boolean;
  onSelected?: (payload: SelectedPayload) => void;
}

const SharedElementSelector: React.FC<SharedElementSelectorProps> = ({
  selectorType = 'css',
  selectedEls = [],
  selectorSettings = {},
  list = false,
  hide = false,
  pause = false,
  disabled = false,
  onlyInList = false,
  withAttributes = false,
  onSelected,
}) => {
  const [hoveredItems, setHoveredItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  const frameElementRef = useRef<Element | null>(null);
  const frameElementRectRef = useRef<DOMRect | null>(null);
  const hoveredElementsRef = useRef<Element[]>([]);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const lastScrollRef = useRef({ x: window.scrollX, y: window.scrollY });

  // Sync selectedEls prop → state
  useEffect(() => {
    setSelectedItems(selectedEls);
  }, [selectedEls]);

  // Reset element list when list/disabled changes
  useEffect(() => {
    removeElementsList();
    resetFramesElements({ clearCache: true });
  }, [list, disabled]);

  function removeElementsList() {
    document.querySelectorAll('[automa-el-list]').forEach((el) => {
      el.removeAttribute('automa-el-list');
    });
  }

  function resetFramesElements(options: Record<string, any> = {}) {
    document.querySelectorAll<HTMLIFrameElement>('iframe, frame').forEach((element) => {
      element.contentWindow?.postMessage({ ...options, type: 'automa:reset-element-selector' }, '*');
    });
  }

  function getElementRect(element: Element, withAttribute?: boolean): any {
    // TODO: use real getElementRect from '@/content/utils'
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      tagName: (element as HTMLElement).tagName,
    };
  }

  function getElementRectWithOffset(element: Element, { withAttribute = false, withElOptions = false } = {}): any {
    const rect = getElementRect(element, withAttribute);
    if (frameElementRectRef.current) {
      rect.y += frameElementRectRef.current.top;
      rect.x += frameElementRectRef.current.left;
    }
    if (withElOptions && (element as HTMLElement).tagName === 'SELECT') {
      rect.options = Array.from(element.querySelectorAll('option')).map((el) => ({
        value: (el as HTMLOptionElement).value,
        name: (el as HTMLOptionElement).innerText,
      }));
    }
    return rect;
  }

  function retrieveElementsRect(
    { clientX, clientY, target: eventTarget }: { clientX: number; clientY: number; target: EventTarget | null },
    type: 'hovered' | 'selected'
  ) {
    if (disabled) return;
    const targetEl = eventTarget as HTMLElement;
    const isAutomaContainer = targetEl?.classList?.contains('automa-element-selector');
    if (isAutomaContainer) return;

    const isSelectList = list && selectorType === 'css';

    let [, target] = document.elementsFromPoint(clientX, clientY) as Element[];
    if (!target) return;

    const onlyInListFlag = onlyInList && selectedItems.length > 0;
    const framesEl = ['IFRAME', 'FRAME'];

    if (framesEl.includes((target as HTMLElement).tagName)) {
      if (type === 'selected') removeElementsList();

      const frameEl = target as HTMLIFrameElement;
      if (frameEl.contentDocument) {
        frameElementRef.current = frameEl;
        frameElementRectRef.current = frameEl.getBoundingClientRect();
        const yPos = clientY - frameElementRectRef.current.top;
        const xPos = clientX - frameElementRectRef.current.left;
        target = frameEl.contentDocument.elementFromPoint(xPos, yPos) as Element;
      } else {
        const { top, left } = frameEl.getBoundingClientRect();
        const payload: any = {
          top,
          left,
          clientX,
          clientY,
          onlyInList: onlyInListFlag,
          list: isSelectList,
          type: 'automa:get-element-rect',
          withAttributes,
        };
        if (type === 'selected') {
          Object.assign(payload, {
            click: true,
            selectorType,
            selectorSettings,
          });
        }
        frameEl.contentWindow?.postMessage(payload, '*');
        frameElementRef.current = frameEl;
        frameElementRectRef.current = frameEl.getBoundingClientRect();
        return;
      }
    } else {
      frameElementRef.current = null;
      frameElementRectRef.current = null;
    }

    let elementsRect: any[] = [];
    const withElOptions = type === 'selected';
    const withAttribute = withAttributes && type === 'selected';

    if (isSelectList) {
      // TODO: use real findElementList
      const elements: Element[] = [target];
      if (type === 'hovered') hoveredElementsRef.current = elements;
      elementsRect = elements.map((el) => getElementRectWithOffset(el, { withAttribute, withElOptions }));
    } else {
      if (type === 'hovered') hoveredElementsRef.current = [target];
      elementsRect = [getElementRectWithOffset(target, { withAttribute, withElOptions })];
    }

    if (type === 'hovered') {
      setHoveredItems(elementsRect);
    } else {
      setSelectedItems(elementsRect);
    }

    if (type === 'selected') {
      if (!frameElementRef.current) resetFramesElements();

      // TODO: use real generateElementsSelector and finder
      const selector = (target as HTMLElement).tagName?.toLowerCase() ?? '';

      const selectElements = elementsRect.reduce<any[]>((acc, rect, index) => {
        if (rect.tagName !== 'SELECT') return acc;
        acc.push({ ...rect, elIndex: index });
        return acc;
      }, []);

      onSelected?.({
        selector,
        selectElements,
        elements: elementsRect,
        // TODO: path: getElementPath(target),
        path: '',
      });
    }
  }

  function onMousemove(event: MouseEvent) {
    if (pause) return;
    mousePositionRef.current = { x: event.clientX, y: event.clientY };
    retrieveElementsRect(event, 'hovered');
  }

  function onKeydown(event: KeyboardEvent) {
    if (pause || event.repeat || event.code !== 'Space') return;
    const [, selectedElement] = document.elementsFromPoint(
      mousePositionRef.current.x,
      mousePositionRef.current.y
    ) as Element[];
    if ((selectedElement as HTMLElement)?.id === 'automa-selector-overlay') return;
    event.preventDefault();
    event.stopPropagation();
    retrieveElementsRect(
      { target: selectedElement, clientX: mousePositionRef.current.x, clientY: mousePositionRef.current.y },
      'selected'
    );
  }

  function onMousedown(event: MouseEvent) {
    if ((event.target as HTMLElement)?.id === 'automa-selector-overlay') {
      event.preventDefault();
      event.stopPropagation();
    }
    retrieveElementsRect(event, 'selected');
  }

  function onScroll() {
    if (disabled) return;
    hoveredElementsRef.current = [];
    setHoveredItems([]);

    const yPos = window.scrollY - lastScrollRef.current.y;
    const xPos = window.scrollX - lastScrollRef.current.x;

    setSelectedItems((prev) =>
      prev.map((item) => ({ ...item, x: item.x - xPos, y: item.y - yPos }))
    );

    lastScrollRef.current = { x: window.scrollX, y: window.scrollY };
  }

  function onMessage({ data }: MessageEvent) {
    if (data.type !== 'automa:iframe-element-rect') return;
    if (data.click) {
      // TODO: use real finder/generateXPath
      const frameSelector = frameElementRef.current?.tagName?.toLowerCase() ?? '';
      onSelected?.({
        elements: data.elements,
        selector: `${frameSelector} |> ${data.selector}`,
      });
    }
    const key = data.click ? 'selected' : 'hovered';
    if (key === 'selected') setSelectedItems(data.elements);
    else setHoveredItems(data.elements);
  }

  function attachListeners() {
    window.addEventListener('scroll', onScroll);
    window.addEventListener('message', onMessage);
    document.addEventListener('keydown', onKeydown);
    window.addEventListener('mousemove', onMousemove);
    document.addEventListener('mousedown', onMousedown);
  }

  function detachListeners() {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('message', onMessage);
    document.removeEventListener('keydown', onKeydown);
    window.removeEventListener('mousemove', onMousemove);
    document.removeEventListener('mousedown', onMousedown);
  }

  useEffect(() => {
    if (!hide) attachListeners();
    else detachListeners();
    return () => detachListeners();
  }, [hide, disabled, pause, list, selectorType, onlyInList, withAttributes]);

  if (disabled) return null;

  return (
    <>
      <svg
        className="automa-element-highlighter"
        style={{
          height: '100%',
          width: '100%',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          position: 'fixed',
          zIndex: 999999,
        }}
      >
        <SharedElementHighlighter
          items={hoveredItems}
          stroke="#fbbf24"
          fill="rgba(251, 191, 36, 0.1)"
        />
        <SharedElementHighlighter
          items={selectedItems}
          stroke="#2563EB"
          activeStroke="#f87171"
          fill="rgba(37, 99, 235, 0.1)"
          activeFill="rgba(248, 113, 113, 0.1)"
        />
      </svg>
      {/* Overlay portal – using a regular div here; for a real portal use ReactDOM.createPortal */}
      <div
        id="automa-selector-overlay"
        style={{
          zIndex: 9999999,
          position: 'fixed',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
        }}
      />
    </>
  );
};

export default SharedElementSelector;
