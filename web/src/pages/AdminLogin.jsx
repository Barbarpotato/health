import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      navigate('/admin');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <span className="grid place-items-center size-12 rounded-2xl bg-gradient-to-br from-neutral-700 to-neutral-900 ring-1 ring-white/10 text-white shadow-lg mb-4">
            <ShieldCheck className="size-6" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-5 flex flex-col gap-3">
          <input
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          <button
            disabled={loading || !username || !password}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 py-2.5 text-sm font-medium text-white disabled:opacity-50 hover:brightness-110 transition"
          >
            {loading ? <Spinner /> : <>Log in <ArrowRight className="size-4" /></>}
          </button>
        </form>

        <Link to="/" className="block text-center mt-5 text-sm text-neutral-400 hover:text-white transition">
          ← Back to site
        </Link>
      </div>
    </div>
  );
}
