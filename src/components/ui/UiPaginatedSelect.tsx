import React, { useState, useEffect, useRef, useMemo, useId } from 'react';
import UiInput from './UiInput';

interface Option {
  [key: string]: unknown;
}

interface LoadOptionsParams {
  query: string;
  page: number;
}

interface LoadOptionsResult {
  data: Option[];
  hasMore: boolean;
}

interface UiPaginatedSelectProps {
  modelValue?: string | number | null;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  loadOptions: (params: LoadOptionsParams) => Promise<LoadOptionsResult>;
  optionValueKey: string;
  optionLabelKey: string;
  initialLabel?: string;
  onChange?: (value: string | number | null, label: string) => void;
  footerSlot?: React.ReactNode;
  className?: string;
}

function debounce<T extends (...args: unknown[]) => void>(func: T, wait: number): T {
  let timeout: ReturnType<typeof setTimeout>;
  return function (this: unknown, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  } as T;
}

export default function UiPaginatedSelect({
  modelValue = null,
  label = '',
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  disabled = false,
  loadOptions,
  optionValueKey,
  optionLabelKey,
  initialLabel = '',
  onChange,
  footerSlot,
  className = '',
}: UiPaginatedSelectProps) {
  const componentId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const optionsListRef = useRef<HTMLUListElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [haveMore, setHaveMore] = useState(true);
  const [localInitialLabel, setLocalInitialLabel] = useState('');
  const fetchRequestToken = useRef(0);

  const selectedOption = useMemo(
    () => options.find((opt) => opt[optionValueKey] === modelValue),
    [options, modelValue, optionValueKey]
  );

  const selectedOptionLabel =
    (selectedOption?.[optionLabelKey] as string) || localInitialLabel;

  async function fetchOptions(isNewSearch: boolean) {
    if (isLoading && !isNewSearch) return;

    setIsLoading(true);
    let currentPage = page;

    if (isNewSearch) {
      fetchRequestToken.current += 1;
      setPage(1);
      setOptions([]);
      setHaveMore(true);
      currentPage = 1;
    }

    const currentToken = fetchRequestToken.current;

    if (!haveMore && !isNewSearch) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, hasMore } = await loadOptions({
        query: searchKeyword,
        page: currentPage,
      });

      if (currentToken !== fetchRequestToken.current) return;

      setOptions((prev) => (isNewSearch ? data : [...prev, ...data]));
      setHaveMore(hasMore);
      if (hasMore) setPage(currentPage + 1);
    } catch (error) {
      console.error('Failed to load options:', error);
      if (currentToken === fetchRequestToken.current) setHaveMore(false);
    } finally {
      if (currentToken === fetchRequestToken.current) setIsLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetch = useMemo(() => debounce(() => fetchOptions(true), 300), []);

  useEffect(() => {
    debouncedFetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKeyword]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside, true);

    if (modelValue && initialLabel) setLocalInitialLabel(initialLabel);
    fetchOptions(true);

    return () => document.removeEventListener('click', handleClickOutside, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleDropdown() {
    if (disabled) return;
    setIsOpen((v) => !v);
  }

  function selectOption(option: Option) {
    const value = option[optionValueKey] as string | number;
    const lbl = option[optionLabelKey] as string;
    setLocalInitialLabel(lbl);
    onChange?.(value, lbl);
    setIsOpen(false);
  }

  function handleScroll(event: React.UIEvent<HTMLUListElement>) {
    const el = event.target as HTMLUListElement;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
      fetchOptions(false);
    }
  }

  return (
    <div
      ref={rootRef}
      className={`ui-paginated-select relative ${disabled ? 'pointer-events-none opacity-75' : ''} ${className}`.trim()}
    >
      {label && (
        <label
          htmlFor={componentId}
          className="ml-1 text-sm text-gray-600 dark:text-gray-200 cursor-pointer"
          onClick={toggleDropdown}
        >
          {label}
        </label>
      )}
      <div className="ui-select__content relative flex w-full items-center">
        <button
          id={componentId}
          type="button"
          className={`bg-input text-left z-10 h-full w-full appearance-none rounded-lg bg-transparent px-4 py-2 pr-10 transition ${
            !selectedOptionLabel ? 'text-gray-500' : ''
          }`}
          disabled={disabled}
          onClick={toggleDropdown}
        >
          {selectedOptionLabel || placeholder}
        </button>
        <i
          className="ri-arrow-drop-down-line pointer-events-none absolute right-0 mr-2 text-gray-600 transition-transform dark:text-gray-200"
          style={{
            fontSize: '28px',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </div>

      {isOpen && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-lg bg-white shadow-xl dark:bg-gray-800">
          <div className="px-2 my-2 w-full">
            <UiInput
              modelValue={searchKeyword}
              placeholder={searchPlaceholder}
              prependIcon="ri-search-2-line"
              autofocus
              className="w-full"
              onChange={(v) => setSearchKeyword(String(v))}
            />
          </div>
          <ul
            ref={optionsListRef}
            className="max-h-60 overflow-y-auto p-2 space-y-2"
            onScroll={handleScroll}
          >
            {options.map((option) => (
              <li
                key={String(option[optionValueKey])}
                className={`cursor-pointer rounded-lg px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  modelValue === option[optionValueKey]
                    ? 'bg-gray-100 font-semibold dark:bg-gray-700'
                    : ''
                }`}
                onClick={() => selectOption(option)}
              >
                {String(option[optionLabelKey])}
              </li>
            ))}
            {isLoading && (
              <li className="px-4 py-2 text-center text-gray-500">Loading...</li>
            )}
            {!haveMore && !isLoading && options.length > 0 && (
              <li className="px-4 py-2 text-center text-sm text-gray-500">No more results</li>
            )}
            {!isLoading && options.length === 0 && (
              <li className="px-4 py-2 text-center text-gray-500">No results found</li>
            )}
          </ul>
          {footerSlot && (
            <div className="border-t border-gray-200 p-2 dark:border-gray-700">
              {footerSlot}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
