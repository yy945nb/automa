// Pinia removed — stores now use Zustand directly
// This file kept for backward compatibility of imports
import browser from 'webextension-polyfill';

// Storage sync utility (extracted from Pinia plugin)
export async function saveToStorage(key: string, value: any) {
  try {
    await browser.storage.local.set({ [key]: JSON.stringify(value) });
  } catch (e) {
    console.warn('saveToStorage failed:', key, e);
  }
}

export async function loadFromStorage(key: string) {
  try {
    const result = await browser.storage.local.get(key);
    return result[key] ? JSON.parse(result[key]) : null;
  } catch (e) {
    console.warn('loadFromStorage failed:', key, e);
    return null;
  }
}

// No-op createPinia replacement
export function createPinia() {
  return {};
}

export default { saveToStorage, loadFromStorage };
