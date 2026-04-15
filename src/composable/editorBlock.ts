import { useState, useEffect } from 'react';
import { getBlocks } from '@/utils/getSharedData';
import { categories } from '@/utils/shared';

export function useEditorBlock() {
  const [blocks, setBlocks] = useState<Record<string, any>>({});

  useEffect(() => {
    const loaded = getBlocks();
    setBlocks(loaded || {});
  }, []);

  return { blocks, categories };
}
