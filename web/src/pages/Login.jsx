import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, ApiError } from '../lib/api';
import { setUser } from '../lib/auth';
import Spinner from '../components/Spinner';

export default function Login() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    const full_name = name.trim();
    if (!full_name) return;

    setLoading(true);
    try {
      const user = await api('/users/login', { method: 'POST', body: JSON.stringify({ full_name }) });
      setUser(user);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <span className="grid place-items-center size-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-pink-500 text-white shadow-lg shadow-indigo-500/20 mb-4">
            <Sparkles className="size-6" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">Wellness Tracker</h1>
          <p className="text-neutral-400 text-sm mt-1">Enter your name to continue — no password needed.</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-5 flex flex-col gap-3">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          <button
            disabled={loading || !name.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 py-2.5 text-sm font-medium text-white disabled:opacity-50 hover:brightness-110 transition"
          >
            {loading ? <Spinner /> : <>Continue <ArrowRight className="size-4" /></>}
          </button>
        </form>

        <div className="flex items-center justify-between mt-5 text-sm text-neutral-400">
          <Link to="/feed" className="hover:text-white transition">
            See everyone's activity →
          </Link>
          <Link to="/admin/login" className="flex items-center gap-1 hover:text-white transition">
            <ShieldCheck className="size-3.5" /> Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
