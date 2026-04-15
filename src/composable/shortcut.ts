import defu from 'defu';
import Mousetrap from 'mousetrap';
import { isObject, parseJSON } from '@/utils/helper';

const defaultShortcut: Record<string, { id: string; combo: string }> = {
  'page:dashboard': { id: 'page:dashboard', combo: 'option+1' },
  'page:workflows': { id: 'page:workflows', combo: 'option+w' },
  'page:schedule': { id: 'page:schedule', combo: 'option+t' },
  'page:logs': { id: 'page:logs', combo: 'option+l' },
  'page:storage': { id: 'page:storage', combo: 'option+s' },
  'action:new': { id: 'action:new', combo: 'option+n' },
};

export function getReadableShortcut(id: string): string {
  const shortcut = defaultShortcut[id];
  return shortcut ? shortcut.combo.replace(/\+/g, ' + ') : '';
}

// React hook version — use useEffect + cleanup
export function useShortcut(shortcuts: Record<string, () => void>, deps: any[] = []) {
  // TODO: React useEffect-based Mousetrap binding
  return { getReadableShortcut };
}

export default defaultShortcut;
