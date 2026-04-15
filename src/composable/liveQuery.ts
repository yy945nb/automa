import { useState, useEffect } from 'react';
import { liveQuery } from 'dexie';

export function useLiveQuery<T>(querier: () => T | Promise<T>, deps: any[] = [], defaultValue?: T): T | undefined {
  const [value, setValue] = useState<T | undefined>(defaultValue);

  useEffect(() => {
    const subscription = liveQuery(querier).subscribe({
      next: (val: any) => setValue(val),
      error: (err: any) => console.error('liveQuery error:', err),
    });
    return () => subscription.unsubscribe();
  }, deps);

  return value;
}
