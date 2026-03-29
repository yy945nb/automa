import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import UiPopover from './UiPopover';
import UiList from './UiList';
import UiListItem from './UiListItem';

type AutocompleteItem = string | Record<string, unknown>;

interface UiAutocompleteProps {
  modelValue?: string;
  items?: AutocompleteItem[];
  itemKey?: string;
  itemLabel?: string;
  triggerChar?: string[];
  customFilter?: ((ctx: { item: AutocompleteItem; index: number; text: string }) => boolean) | null;
  replaceAfter?: string | string[] | null;
  block?: boolean;
  disabled?: boolean;
  hideEmpty?: boolean;
  onChange?: (value: string) => void;
  onSearch?: (text: string | null) => void;
  onSelect?: (ctx: { index: number; item: AutocompleteItem }) => void;
  onCancel?: () => void;
  onSelected?: (ctx: { index: number; item: AutocompleteItem }) => void;
  /** Item slot — receives item */
  itemSlot?: (item: AutocompleteItem) => React.ReactNode;
  children?: React.ReactNode;
}

export interface UiAutocompleteHandle {
  state: {
    charIndex: number;
    searchText: string;
    activeIndex: number;
    showPopover: boolean;
    inputChanged: boolean;
  };
}

function debounce<T extends (...args: unknown[]) => void>(fn: T, wait: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return function (this: unknown, ...args: Parameters<T>) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  } as T;
}

const UiAutocomplete = forwardRef<UiAutocompleteHandle, UiAutocompleteProps>(
  function UiAutocomplete(
    {
      modelValue = '',
      items = [],
      itemKey = '',
      itemLabel = '',
      triggerChar = [],
      customFilter = null,
      replaceAfter = null,
      block = false,
      disabled = false,
      hideEmpty = false,
      onChange,
      onSearch,
      onSelect,
      onCancel,
      onSelected,
      itemSlot,
      children,
    },
    ref
  ) {
    const triggerWrapRef = useRef<HTMLDivElement>(null);
    const popoverContentRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

    const [charIndex, setCharIndex] = useState(-1);
    const [searchText, setSearchText] = useState('');
    const [activeIndex, setActiveIndex] = useState(-1);
    const [showPopover, setShowPopover] = useState(false);
    const [inputChanged, setInputChanged] = useState(false);

    useImperativeHandle(ref, () => ({
      state: { charIndex, searchText, activeIndex, showPopover, inputChanged },
    }));

    function getItem(item: AutocompleteItem, key = false): string {
      if (typeof item === 'object' && item !== null) {
        const k = key ? itemKey : itemLabel;
        return String((item as Record<string, unknown>)[k] ?? '');
      }
      return String(item);
    }

    const filteredItems = useMemo(() => {
      if (!showPopover) return [];

      const hasTriggerChar = triggerChar.length > 0;
      const rawText = hasTriggerChar ? searchText : modelValue;
      const text = rawText.toLocaleLowerCase();

      const defaultFilter = ({ item, text: t }: { item: AutocompleteItem; text: string; index: number }) =>
        getItem(item)?.toLocaleLowerCase().includes(t) ?? false;

      const filterFn = customFilter || defaultFilter;

      return items.filter((item, index) => !inputChanged || filterFn({ item, index, text }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showPopover, searchText, modelValue, items, inputChanged, triggerChar, customFilter]);

    // ── Scroll active item into view ──────────────────────────────────────
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const scrollToActive = useCallback(
      debounce((idx: number) => {
        const container = popoverContentRef.current;
        if (!container) return;
        const element = container.querySelector(`[data-ac-index="${idx}"]`);
        if (element) {
          const cTop = container.scrollTop;
          const cBottom = cTop + container.clientHeight;
          const eTop = (element as HTMLElement).offsetTop;
          const eBottom = eTop + (element as HTMLElement).clientHeight;
          const inView = eTop >= cTop && eBottom <= cBottom;
          if (!inView) element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
        onSelect?.({ index: idx, item: filteredItems[idx] });
      }, 100),
      [filteredItems, onSelect]
    );

    useEffect(() => {
      if (activeIndex >= 0) scrollToActive(activeIndex);
    }, [activeIndex, scrollToActive]);

    useEffect(() => {
      if (filteredItems.length === 0 && hideEmpty) setShowPopover(false);
    }, [filteredItems, hideEmpty]);

    useEffect(() => {
      if (!showPopover) setInputChanged(false);
    }, [showPopover]);

    // ── Input helpers ─────────────────────────────────────────────────────
    function getLastKeyBeforeCaret(caretIndex: number): number {
      if (!inputRef.current) return -1;
      const getPosition = (val: string, i: number) => ({
        index: i,
        charIndex: (inputRef.current!.value as string).lastIndexOf(val, caretIndex - 1),
      });
      const [charData] = triggerChar
        .map(getPosition)
        .sort((a, b) => b.charIndex - a.charIndex);
      if (charData.index > 0) return -1;
      return charData.charIndex;
    }

    function getSearchTextFromCaret(caretIndex: number, cIdx: number): string | null {
      if (!inputRef.current || cIdx === -1) return null;
      const closeTrigger = triggerChar[1];
      const searchRgxp = new RegExp(`\\s${closeTrigger ? `|${closeTrigger}` : ''}`);
      const inputValue = inputRef.current.value;
      const afterCaret = inputValue.substring(caretIndex);
      const lastClosingIdx = afterCaret.search(searchRgxp);
      const charsLength = triggerChar[0].length;
      const text =
        inputValue.substring(cIdx + charsLength, caretIndex) +
        afterCaret.substring(0, lastClosingIdx);
      if (!/\s/.test(text)) return text;
      return null;
    }

    function doShowPopover() {
      if (disabled) return;
      if (triggerChar.length < 1) { setShowPopover(true); return; }

      const el = inputRef.current;
      if (!el) return;
      const { selectionStart } = el as HTMLInputElement;
      if (selectionStart != null && selectionStart >= 0) {
        const cIdx = getLastKeyBeforeCaret(selectionStart);
        const text = getSearchTextFromCaret(selectionStart, cIdx);
        onSearch?.(text);
        if (cIdx >= 0 && text) {
          setInputChanged(true);
          setShowPopover(true);
          setSearchText(text);
          setCharIndex(cIdx);
          return;
        }
      }
      setCharIndex(-1);
      setSearchText('');
      setShowPopover(false);
    }

    function updateValue(value: string) {
      setInputChanged(true);
      onChange?.(value);
      if (inputRef.current) {
        (inputRef.current as HTMLInputElement).value = value;
        inputRef.current.dispatchEvent(new Event('input'));
      }
    }

    function selectItem(itemIndex: number, selected: boolean) {
      let selectedItem = filteredItems[itemIndex];
      if (!selectedItem) return;
      const selectedStr = getItem(selectedItem);

      let caretPosition: number | undefined;
      const isTriggerChar = charIndex >= 0 && searchText;

      if (isTriggerChar && inputRef.current) {
        const val = inputRef.current.value;
        const cIdx = charIndex;
        const charLength = triggerChar[0].length;
        const lastSearchIndex = searchText.length + cIdx + charLength;
        let charLastIndex = 0;

        if (replaceAfter) {
          const lastChars = Array.isArray(replaceAfter) ? replaceAfter : [replaceAfter];
          lastChars.forEach((char) => {
            const searchSlice = val.slice(0, lastSearchIndex);
            const lastIndex = searchSlice.lastIndexOf(char);
            if (lastIndex > charLastIndex && lastIndex > cIdx) charLastIndex = lastIndex - 1;
          });
        }

        caretPosition = cIdx + charLength + selectedStr.length + charLastIndex;
        const newValue =
          val.slice(0, cIdx + charLength + charLastIndex) +
          selectedStr +
          val.slice(lastSearchIndex);
        updateValue(newValue);

        if (selected) onSelected?.({ index: itemIndex, item: filteredItems[itemIndex] });

        const el = inputRef.current as HTMLInputElement;
        el.selectionEnd = caretPosition;
        if (el.tagName !== 'TEXTAREA') { el.blur(); el.focus(); }
      } else {
        updateValue(selectedStr);
        if (selected) onSelected?.({ index: itemIndex, item: filteredItems[itemIndex] });
      }
    }

    // ── Keyboard handler attached to the input ────────────────────────────
    function handleKeydown(event: KeyboardEvent) {
      if (!showPopover) return;
      const length = filteredItems.length - 1;
      if (event.key === 'ArrowUp') {
        setActiveIndex((i) => (i <= 0 ? length : i - 1));
        event.preventDefault();
      } else if (event.key === 'ArrowDown') {
        setActiveIndex((i) => (i >= length ? 0 : i + 1));
        event.preventDefault();
      } else if (event.key === 'Enter' && showPopover) {
        selectItem(activeIndex, true);
        event.preventDefault();
      } else if (event.key === 'Escape') {
        onCancel?.();
        setShowPopover(false);
      }
    }

    function handleBlur() { setShowPopover(false); }
    function handleFocus() { if (triggerChar.length > 0) doShowPopover(); }
    function handleInput() { setInputChanged(true); }

    // ── Mount / unmount ───────────────────────────────────────────────────
    useEffect(() => {
      const wrapper = triggerWrapRef.current;
      const el = wrapper?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        'input, textarea'
      ) ?? null;
      inputRef.current = el;
      if (!el) return;

      if (modelValue) {
        const idx = items.findIndex((item) => getItem(item) === modelValue);
        if (idx !== -1) setActiveIndex(idx);
      }

      el.addEventListener('blur', handleBlur);
      el.addEventListener('input', handleInput);
      el.addEventListener('focus', handleFocus);
      el.addEventListener('input', doShowPopover);
      el.addEventListener('keydown', handleKeydown as EventListener);

      return () => {
        el.removeEventListener('blur', handleBlur);
        el.removeEventListener('input', handleInput);
        el.removeEventListener('focus', handleFocus);
        el.removeEventListener('input', doShowPopover);
        el.removeEventListener('keydown', handleKeydown as EventListener);
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <UiPopover
        modelValue={showPopover}
        padding="p-2 max-h-56 overflow-auto scroll"
        triggerWidth
        trigger="manual"
        className={`ui-autocomplete ${block ? 'block' : ''}`.trim()}
        triggerSlot={() => (
          <div ref={triggerWrapRef} style={{ display: 'contents' }}>
            {children}
          </div>
        )}
      >
        <div ref={popoverContentRef}>
          {filteredItems.length === 0 ? (
            <p className="text-center">No data</p>
          ) : (
            <UiList className="space-y-1">
              {filteredItems.map((item, index) => (
                <UiListItem
                  key={getItem(item, true) || String(index)}
                  data-ac-index={index}
                  className={`cursor-pointer ${activeIndex === index ? 'bg-box-transparent' : ''}`}
                  onMouseDown={() => selectItem(index, true)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  {itemSlot ? itemSlot(item) : getItem(item)}
                </UiListItem>
              ))}
            </UiList>
          )}
        </div>
        <style>{`
          .ui-autocomplete.block,
          .ui-autocomplete.block .ui-popover__trigger {
            width: 100%;
            display: block;
          }
        `}</style>
      </UiPopover>
    );
  }
);

export default UiAutocomplete;
