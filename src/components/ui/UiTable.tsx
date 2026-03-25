import React, { useState, useEffect, useMemo, useRef } from 'react';
import UiPagination from './UiPagination';

interface TableHeader {
  text?: string;
  value: string;
  align?: string;
  sortable?: boolean;
  filterable?: boolean;
  attrs?: Record<string, unknown>;
  rowAttrs?: Record<string, unknown>;
  rowEvents?: Record<string, unknown>;
}

type HeaderInput = string | TableHeader;

interface UiTableProps {
  headers?: HeaderInput[];
  items?: Record<string, unknown>[];
  itemKey: string;
  search?: string;
  customFilter?: ((search: string, item: Record<string, unknown>, index: number) => boolean) | null;
  withPagination?: boolean;
  /** Slot: renders before each row's cells */
  itemPrepend?: (item: Record<string, unknown>) => React.ReactNode;
  /** Slot: renders after each row's cells */
  itemAppend?: (item: Record<string, unknown>) => React.ReactNode;
  /** Per-column cell slot: key is `item-${header.value}` */
  cellSlots?: Record<string, (item: Record<string, unknown>) => React.ReactNode>;
}

function normalizeHeader(header: HeaderInput): TableHeader {
  if (typeof header === 'string') {
    return {
      text: header,
      value: header,
      align: 'left',
      sortable: true,
      filterable: false,
      attrs: {},
      rowAttrs: {},
    };
  }
  return {
    align: 'left',
    sortable: true,
    filterable: false,
    attrs: {},
    rowAttrs: {},
    text: header.value,
    ...header,
  };
}

function arraySorter(data: Record<string, unknown>[], key: string, order: string) {
  return [...data].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av === bv) return 0;
    const gt = av! > bv! ? 1 : -1;
    return order === 'asc' ? gt : -gt;
  });
}

export default function UiTable({
  headers = [],
  items = [],
  itemKey,
  search = '',
  customFilter = null,
  withPagination = false,
  itemPrepend,
  itemAppend,
  cellSlots = {},
}: UiTableProps) {
  const [sortId, setSortId] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const normalizedHeaders = useMemo(
    () => headers.map(normalizeHeader),
    [headers]
  );

  const filterKeys = useMemo(
    () => normalizedHeaders.filter((h) => h.filterable).map((h) => h.value),
    [normalizedHeaders]
  );

  const sortedItems = useMemo(() => {
    const sorted = sortId
      ? arraySorter(items, sortId, sortOrder)
      : items;

    if (!withPagination) return sorted;
    return sorted.slice((currentPage - 1) * perPage, currentPage * perPage);
  }, [items, sortId, sortOrder, withPagination, currentPage, perPage]);

  const filteredItems = useMemo(() => {
    if (!search) return sortedItems;

    const filterFunc =
      customFilter ||
      ((s: string, item: Record<string, unknown>) => {
        return filterKeys.some((key) => {
          const value = item[key];
          if (typeof value === 'string') return value.toLocaleLowerCase().includes(s);
          return value === s;
        });
      });

    const s = search.toLocaleLowerCase();
    return sortedItems.filter((item, index) => filterFunc(s, item, index));
  }, [sortedItems, search, customFilter, filterKeys]);

  function updateSort(header: TableHeader) {
    if (!header.sortable) return;
    if (sortId !== header.value) {
      setSortId(header.value);
      setSortOrder('asc');
      return;
    }
    if (sortOrder === 'asc') {
      setSortOrder('desc');
    } else {
      setSortId('');
    }
  }

  return (
    <div className="ui-table">
      <table className="custom-table h-full w-full">
        <thead>
          <tr>
            {normalizedHeaders.map((header) => (
              <th
                key={header.value}
                align={header.align as 'left' | 'right' | 'center' | undefined}
                className="relative"
                {...(header.attrs as React.ThHTMLAttributes<HTMLTableCellElement>)}
              >
                <span
                  className={header.sortable ? 'cursor-pointer inline-block' : 'inline-block'}
                  onClick={() => updateSort(header)}
                >
                  {header.text}
                </span>
                {header.sortable && (
                  <span className="sort-icon ml-1 cursor-pointer" onClick={() => updateSort(header)}>
                    {sortId === header.value ? (
                      <i
                        className="ri-arrow-left-line transition-transform"
                        style={{
                          transform: `rotate(${sortOrder === 'asc' ? 90 : -90}deg)`,
                          fontSize: '20px',
                          display: 'inline-block',
                        }}
                      />
                    ) : (
                      <i className="ri-arrow-up-down-line" style={{ fontSize: '20px' }} />
                    )}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredItems.map((item) => (
            <tr key={String(item[itemKey])}>
              {itemPrepend?.(item)}
              {normalizedHeaders.map((header) => (
                <td
                  key={header.value}
                  align={header.align as 'left' | 'right' | 'center' | undefined}
                  {...(header.rowAttrs as React.TdHTMLAttributes<HTMLTableCellElement>)}
                >
                  {cellSlots[`item-${header.value}`]
                    ? cellSlots[`item-${header.value}`](item)
                    : String(item[header.value] ?? '')}
                </td>
              ))}
              {itemAppend?.(item)}
            </tr>
          ))}
        </tbody>
      </table>
      {withPagination && filteredItems.length >= 10 && (
        <div className="mt-4 flex items-center justify-between">
          <div>
            Show{' '}
            <select
              value={perPage}
              className="bg-input rounded-md p-1"
              onChange={(e) => setPerPage(Number(e.target.value))}
            >
              {[10, 15, 25, 50, 100, 150].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            {` of ${filteredItems.length} entries`}
          </div>
          <UiPagination
            modelValue={currentPage}
            perPage={perPage}
            records={items.length}
            onChange={setCurrentPage}
            onPaginate={setCurrentPage}
          />
        </div>
      )}
      <style>{`
        .sort-icon i {
          color: #4b5563;
          display: inline-block;
        }
      `}</style>
    </div>
  );
}
