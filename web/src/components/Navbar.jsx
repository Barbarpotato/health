import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, LogOut } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import ConfirmDialog from './ConfirmDialog';

export default function Navbar({ user, onLogout, links = [] }) {
  const { pathname } = useLocation();
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 dark:border-white/5 bg-neutral-50/80 dark:bg-neutral-950/70 backdrop-blur-xl">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          <span className="grid place-items-center size-7 rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 text-white">
            <Sparkles className="size-4" />
          </span>
          <span className="hidden sm:inline">Wellness</span>
        </span>

        <nav className="flex items-center gap-1.5 text-sm">
          {links.map((l) => {
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`rounded-full px-3 py-1.5 font-medium transition ${
                  active
                    ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {l.label}
              </Link>
            );
          })}

          <ThemeToggle />

          {user && (
            <span className="hidden sm:inline-flex items-center rounded-full bg-black/5 dark:bg-white/5 px-3 py-1.5 text-neutral-600 dark:text-neutral-400">
              {user}
            </span>
          )}

          {onLogout && (
            <button
              onClick={() => setConfirmLogout(true)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 transition"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          )}
        </nav>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        title="Keluar dari akun?"
        description="Kamu perlu masuk lagi untuk melanjutkan."
        confirmLabel="Keluar"
        danger
        onConfirm={() => {
          setConfirmLogout(false);
          onLogout();
        }}
        onCancel={() => setConfirmLogout(false)}
      />
    </header>
  );
}
