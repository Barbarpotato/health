import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { getTheme, applyTheme } from '../lib/theme';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <button
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      className="rounded-full p-2 text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white transition"
      title={theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
    >
      {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
