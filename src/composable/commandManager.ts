import { useRef, useCallback, useState } from 'react';

export function useCommandManager({ maxHistory = 100 } = {}) {
  const history = useRef<any[]>([]);
  const [pointer, setPointer] = useState(-1);

  const execute = useCallback((command: any) => {
    history.current = history.current.slice(0, pointer + 1);
    history.current.push(command);
    if (history.current.length > maxHistory) history.current.shift();
    setPointer(history.current.length - 1);
    command.execute?.();
  }, [pointer, maxHistory]);

  const undo = useCallback(() => {
    if (pointer < 0) return;
    history.current[pointer]?.undo?.();
    setPointer(p => p - 1);
  }, [pointer]);

  const redo = useCallback(() => {
    if (pointer >= history.current.length - 1) return;
    setPointer(p => p + 1);
    history.current[pointer + 1]?.execute?.();
  }, [pointer]);

  return { execute, undo, redo, canUndo: pointer >= 0, canRedo: pointer < history.current.length - 1 };
}
