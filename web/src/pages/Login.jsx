import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, ApiError } from '../lib/api';
import { setUser } from '../lib/auth';
import Spinner from '../components/Spinner';
import ThemeToggle from '../components/ThemeToggle';

export default function Login() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    const full_name = name.trim();
    if (!full_name || !password) return;

    setLoading(true);
    try {
      const user = await api('/users/login', { method: 'POST', body: JSON.stringify({ full_name, password }) });
      setUser(user);
      navigate('/feed');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <span className="grid place-items-center size-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-pink-500 text-white shadow-lg shadow-indigo-500/20 mb-4">
            <Sparkles className="size-6" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Wellness Tracker
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Masuk dengan nama dan kata sandi yang diberikan admin.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-5 flex flex-col gap-3">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama lengkap"
            className="w-full rounded-xl bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 px-4 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Kata sandi"
            className="w-full rounded-xl bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 px-4 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          <button
            disabled={loading || !name.trim() || !password}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 py-2.5 text-sm font-medium text-white disabled:opacity-50 hover:brightness-110 transition"
          >
            {loading ? <Spinner /> : <>Lanjutkan <ArrowRight className="size-4" /></>}
          </button>
        </form>

        <div className="flex items-center justify-center mt-5">
          <Link
            to="/admin/login"
            className="rounded-full px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white transition"
          >
            Masuk sebagai admin →
          </Link>
        </div>
      </div>
    </div>
  );
}
