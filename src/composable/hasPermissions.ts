import { useState, useEffect } from 'react';

export function useHasPermissions(permissions: string[] = []) {
  const [hasPermissions, setHasPermissions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // TODO: Check browser.permissions.contains for each permission
    const result: Record<string, boolean> = {};
    permissions.forEach(p => { result[p] = true; });
    setHasPermissions(result);
  }, [permissions.join(',')]);

  return hasPermissions;
}
