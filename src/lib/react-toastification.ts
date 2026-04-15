// Shim for react-toastification — wraps simple toast notifications
// TODO: Replace with a proper toast library (react-hot-toast, sonner, etc.)

export function toast(message: string, _options?: Record<string, unknown>) {
  // Fallback: use browser alert or console
  if (typeof window !== 'undefined') {
    // Try to use a simple DOM-based toast
    const el = document.createElement('div');
    el.textContent = message;
    Object.assign(el.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 24px',
      background: '#333',
      color: '#fff',
      borderRadius: '6px',
      zIndex: '99999',
      fontSize: '14px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      transition: 'opacity 0.3s',
    });
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 300);
    }, 3000);
  }
}

toast.success = (msg: string) => toast(msg);
toast.error = (msg: string) => toast(msg);
toast.warning = (msg: string) => toast(msg);
toast.info = (msg: string) => toast(msg);

export function useToast() {
  return toast;
}

export default toast;
