import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, LogOut } from 'lucide-react';

export default function Navbar({ user, onLogout, links = [] }) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-neutral-950/70 backdrop-blur-xl">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid place-items-center size-7 rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 text-white">
            <Sparkles className="size-4" />
          </span>
          Wellness
        </Link>

        <nav className="flex items-center gap-4 text-sm text-neutral-300">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-white transition">
              {l.label}
            </Link>
          ))}

          {user && (
            <span className="hidden sm:inline text-neutral-500">·</span>
          )}
          {user && <span className="text-neutral-400">{user}</span>}

          {onLogout && (
            <button
              onClick={() => {
                onLogout();
                navigate(0);
              }}
              className="flex items-center gap-1.5 text-neutral-400 hover:text-red-400 transition"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
