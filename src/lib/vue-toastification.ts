// Vue-toastification removed — using custom toast shim
export function toast(message: string, options?: any) {
  console.log('[Toast]', message, options);
}

export default {
  install: () => { /* no-op for React */ },
};
