import { useRef, useEffect, useState } from 'react';
import blocksValidation from '@/newtab/utils/blocksValidation';

export function useBlockValidation(nodes: any[], edges: any[]) {
  const [errors, setErrors] = useState<Record<string, any>>({});
  const prevRef = useRef<string>('');

  useEffect(() => {
    const key = JSON.stringify({ nodes, edges });
    if (key === prevRef.current) return;
    prevRef.current = key;
    try {
      const result = blocksValidation(nodes, edges);
      setErrors(result || {});
    } catch { /* ignore */ }
  }, [nodes, edges]);

  return errors;
}
