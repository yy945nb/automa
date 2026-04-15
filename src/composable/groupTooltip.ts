import { useRef, useEffect } from 'react';

export function useGroupTooltip(options: any = {}) {
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // TODO: createSingleton tippy.js integration
    return () => { /* cleanup */ };
  }, []);

  return { containerRef };
}
