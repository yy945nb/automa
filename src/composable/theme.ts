import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState<string>('system');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved) setTheme(saved);
    } catch { /* ignore */ }
  }, []);

  const applyTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return { theme, setTheme: applyTheme };
}
