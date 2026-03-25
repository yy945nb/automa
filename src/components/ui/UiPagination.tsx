import React, { useState, useEffect, useRef, useMemo } from 'react';
import UiButton from './UiButton';

interface UiPaginationProps {
  modelValue?: number;
  records?: number;
  perPage?: number;
  onChange?: (page: number) => void;
  onPaginate?: (page: number) => void;
}

export default function UiPagination({
  modelValue = 1,
  records = 10,
  perPage = 10,
  onChange,
  onPaginate,
}: UiPaginationProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const maxPage = useMemo(() => Math.ceil(records / perPage), [records, perPage]);

  useEffect(() => {
    emitEvent(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPage, records]);

  function emitEvent(page: number) {
    onChange?.(page);
    onPaginate?.(page);
  }

  function updatePage(page: number, element?: HTMLInputElement) {
    let currentPage = page;
    if (currentPage > maxPage || currentPage < 1) {
      if (!element) return;
      currentPage = currentPage > maxPage ? maxPage : 1;
    }
    emitEvent(currentPage);
  }

  return (
    <div className="flex items-center">
      <UiButton
        icon
        disabled={modelValue <= 1}
        onClick={() => updatePage(modelValue - 1)}
      >
        <i className="ri-arrow-left-s-line" />
      </UiButton>
      <div className="mx-4">
        <input
          ref={inputRef}
          value={modelValue}
          max={maxPage}
          min={1}
          className="bg-input w-10 appearance-none rounded-lg p-2 text-center transition"
          type="number"
          onClick={(e) => (e.target as HTMLInputElement).select()}
          onInput={(e) => {
            const el = e.target as HTMLInputElement;
            updatePage(Number(el.value), el);
          }}
          onChange={() => {/* controlled via onInput */}}
        />
        {` of ${maxPage}`}
      </div>
      <UiButton
        icon
        disabled={modelValue >= maxPage}
        onClick={() => updatePage(modelValue + 1)}
      >
        <i className="ri-arrow-left-s-line" style={{ transform: 'rotate(180deg)', display: 'inline-block' }} />
      </UiButton>
      <style>{`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type='number'] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}
