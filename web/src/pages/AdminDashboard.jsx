import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ChevronLeft, ChevronRight, ArrowUpDown, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import CategoryBadge from '../components/CategoryBadge';
import PhotoGrid from '../components/PhotoGrid';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { CATEGORIES } from '../lib/categories';

const inputClass =
  'rounded-lg bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [username, setUsername] = useState('');
  const [users, setUsers] = useState([]);

  const [newUserName, setNewUserName] = useState('');
  const [addingUser, setAddingUser] = useState(false);

  const [filters, setFilters] = useState({
    category: '',
    user_id: '',
    date_from: '',
    date_to: '',
    search: '',
    sort_by: 'created_at',
    sort_dir: 'desc',
    limit: 10,
  });
  const [offset, setOffset] = useState(0);
  const [report, setReport] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin/me');
      if (!res.ok) {
        navigate('/admin/login');
        return;
      }
      const me = await res.json();
      setUsername(me.username);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    fetch('/api/users')
      .then((r) => r.json())
      .then(setUsers);
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    loadReport();
  }, [ready, filters, offset]);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    params.set('offset', offset);
    return params.toString();
  }, [filters, offset]);

  async function loadReport() {
    setReport(null);
    const res = await fetch(`/api/admin/report?${query}`);
    if (res.status === 401) {
      navigate('/admin/login');
      return;
    }
    setReport(await res.json());
  }

  function updateFilter(key, value) {
    setOffset(0);
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function resetFilters() {
    setOffset(0);
    setFilters({
      category: '',
      user_id: '',
      date_from: '',
      date_to: '',
      search: '',
      sort_by: 'created_at',
      sort_dir: 'desc',
      limit: 10,
    });
  }

  function toggleSort(column) {
    setOffset(0);
    setFilters((f) =>
      f.sort_by === column
        ? { ...f, sort_dir: f.sort_dir === 'asc' ? 'desc' : 'asc' }
        : { ...f, sort_by: column, sort_dir: 'desc' }
    );
  }

  async function handleAddUser(e) {
    e.preventDefault();
    const full_name = newUserName.trim();
    if (!full_name) return;

    setAddingUser(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menambah pengguna');
      toast.success(`"${data.full_name}" berhasil ditambahkan`);
      setNewUserName('');
      fetch('/api/users').then((r) => r.json()).then(setUsers);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAddingUser(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    navigate('/admin/login');
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-400 dark:text-neutral-500">
        <Spinner className="size-6" />
      </div>
    );
  }

  const limit = report?.limit ?? filters.limit;
  const count = report?.count ?? 0;
  const shownFrom = count === 0 ? 0 : offset + 1;
  const shownTo = Math.min(offset + limit, count);

  return (
    <div className="min-h-screen">
      <Navbar user={username} onLogout={handleLogout} />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-col gap-6">
        <section className="glass rounded-2xl p-5">
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-3">Tambah pengguna</h2>
          <form onSubmit={handleAddUser} className="flex gap-2">
            <input
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="Nama lengkap"
              className={`${inputClass} flex-1`}
            />
            <button
              disabled={addingUser || !newUserName.trim()}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 hover:brightness-110 transition"
            >
              {addingUser ? <Spinner className="size-4" /> : <UserPlus className="size-4" />}
              Tambah
            </button>
          </form>
        </section>

        <section className="glass rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Laporan aktivitas</h2>
            <button
              onClick={resetFilters}
              className="text-xs text-neutral-500 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition"
            >
              Reset filter
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
              className={inputClass}
            >
              <option value="">Semua kategori</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            <select
              value={filters.user_id}
              onChange={(e) => updateFilter('user_id', e.target.value)}
              className={inputClass}
            >
              <option value="">Semua pengguna</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => updateFilter('date_from', e.target.value)}
              className={inputClass}
            />
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => updateFilter('date_to', e.target.value)}
              className={inputClass}
            />

            <input
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Cari caption"
              className={`${inputClass} flex-1 min-w-[160px]`}
            />

            <select
              value={filters.limit}
              onChange={(e) => updateFilter('limit', e.target.value)}
              className={inputClass}
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} / halaman
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
            <span>{count} aktivitas</span>
            <div className="flex items-center gap-3">
              <span>
                {shownFrom}–{shownTo} dari {count}
              </span>
              <div className="flex gap-1">
                <button
                  disabled={offset === 0}
                  onClick={() => setOffset((o) => Math.max(0, o - limit))}
                  className="rounded-lg p-1.5 ring-1 ring-black/10 dark:ring-white/10 disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/5 transition"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  disabled={offset + limit >= count}
                  onClick={() => setOffset((o) => o + limit)}
                  className="rounded-lg p-1.5 ring-1 ring-black/10 dark:ring-white/10 disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/5 transition"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-thin -mx-5">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-neutral-500 border-b border-black/10 dark:border-white/10">
                  <SortableHeader label="Tanggal" column="created_at" filters={filters} onSort={toggleSort} />
                  <th className="px-5 py-2 font-medium">Pengguna</th>
                  <SortableHeader label="Kategori" column="category" filters={filters} onSort={toggleSort} />
                  <th className="px-5 py-2 font-medium">Caption</th>
                  <th className="px-5 py-2 font-medium">Foto</th>
                </tr>
              </thead>
              <tbody>
                {report === null &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-black/5 dark:border-white/5">
                      <td className="px-5 py-3" colSpan={5}>
                        <div className="h-4 rounded bg-black/5 dark:bg-white/5 animate-pulse" />
                      </td>
                    </tr>
                  ))}

                {report?.data.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition"
                  >
                    <td className="px-5 py-3 whitespace-nowrap text-neutral-500 dark:text-neutral-400">
                      {new Date(a.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-neutral-900 dark:text-neutral-100">
                      {a.users?.full_name ?? '—'}
                    </td>
                    <td className="px-5 py-3">
                      <CategoryBadge category={a.category} />
                    </td>
                    <td className="px-5 py-3 max-w-xs text-neutral-800 dark:text-neutral-200">
                      {a.caption || <span className="text-neutral-400 dark:text-neutral-600">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <PhotoGrid photos={a.photos} size={36} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {report?.data.length === 0 && (
              <EmptyState icon={X} title="Tidak ada aktivitas yang cocok dengan filter ini" />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function SortableHeader({ label, column, filters, onSort }) {
  const active = filters.sort_by === column;
  return (
    <th className="px-5 py-2 font-medium">
      <button
        onClick={() => onSort(column)}
        className={`flex items-center gap-1 transition ${
          active ? 'text-neutral-900 dark:text-white' : 'hover:text-neutral-700 dark:hover:text-neutral-300'
        }`}
      >
        {label}
        <ArrowUpDown className={`size-3 ${active ? 'opacity-100' : 'opacity-40'}`} />
      </button>
    </th>
  );
}
