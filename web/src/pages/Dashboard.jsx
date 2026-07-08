import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImagePlus, X, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import ActivityCard from '../components/ActivityCard';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';
import ConfirmDialog from '../components/ConfirmDialog';
import { CATEGORIES } from '../lib/categories';
import { api, ApiError } from '../lib/api';
import { getUser, clearUser } from '../lib/auth';

const PAGE_SIZE = 10;

export default function Dashboard() {
  const navigate = useNavigate();
  const [user] = useState(getUser());
  const [activities, setActivities] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const sentinelRef = useRef(null);
  const [category, setCategory] = useState(null);
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmPost, setConfirmPost] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadMore();
  }, []);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '400px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;

    const res = await api(`/activities?user_id=${user.id}&limit=${PAGE_SIZE}&offset=${offsetRef.current}`);
    setActivities((prev) => [...(prev || []), ...res.data]);
    offsetRef.current += res.data.length;
    const more = offsetRef.current < res.count;
    hasMoreRef.current = more;
    setHasMore(more);

    loadingRef.current = false;
  }, []);

  function reloadFromStart() {
    offsetRef.current = 0;
    hasMoreRef.current = true;
    setHasMore(true);
    setActivities(null);
    loadMore();
  }

  function addFiles(newFiles) {
    setFiles((prev) => [...prev, ...Array.from(newFiles)]);
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!category) {
      toast.error('Pilih jenis aktivitas terlebih dahulu.');
      return;
    }
    if (files.length === 0) {
      toast.error('Tambahkan minimal 1 foto sebelum memposting.');
      return;
    }
    setConfirmPost(true);
  }

  async function submitActivity() {
    setConfirmPost(false);
    setSubmitting(true);
    try {
      const activity = await api('/activities', {
        method: 'POST',
        body: JSON.stringify({ user_id: user.id, category, caption: caption.trim() }),
      });

      for (const file of files) {
        const fd = new FormData();
        fd.append('activity_id', activity.id);
        fd.append('file', file);
        await fetch('/api/photos/upload', { method: 'POST', body: fd });
      }

      toast.success('Aktivitas berhasil diposting!');
      setCategory(null);
      setCaption('');
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      reloadFromStart();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Gagal memposting aktivitas');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    await api(`/activities/${id}`, { method: 'DELETE' });
    toast.success('Aktivitas dan foto dihapus.');
    reloadFromStart();
  }

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <Navbar
        user={user.full_name}
        onLogout={() => {
          clearUser();
          navigate('/');
        }}
        links={[{ to: '/feed', label: 'Semua orang' }]}
      />

      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-8 flex flex-col gap-8">
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-5 flex flex-col gap-4">
          <div>
            {!category && (
              <p className="text-xs font-medium text-pink-600 dark:text-pink-400 mb-2 animate-pulse">
                Pilih jenis aktivitas dulu
              </p>
            )}
            <div className="flex gap-2">
              {CATEGORIES.map((c) => {
                const Icon = c.icon;
                const active = category === c.value;
                return (
                  <button
                    type="button"
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    className={`flex-1 flex flex-col items-center gap-1.5 rounded-xl py-3 text-xs font-medium ring-1 transition ${
                      active
                        ? `${c.bg} ${c.color} ${c.ring}`
                        : category
                          ? 'ring-black/5 dark:ring-white/5 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                          : 'ring-2 ring-pink-400/50 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 animate-pulse'
                    }`}
                  >
                    <Icon className="size-5" strokeWidth={2} />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Apa yang kamu lakukan?"
            rows={2}
            className="w-full resize-none rounded-xl bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 px-4 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div key={i} className="relative size-16 rounded-lg overflow-hidden ring-1 ring-black/10 dark:ring-white/10">
                  <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition"
                  >
                    <X className="size-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer transition">
              <ImagePlus className="size-4" />
              {files.length === 0 ? 'Tambah foto (wajib)' : `${files.length} foto dipilih`}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => addFiles(e.target.files)}
                className="hidden"
              />
            </label>

            <button
              disabled={submitting || files.length === 0 || !category}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 hover:brightness-110 transition"
            >
              {submitting ? <Spinner className="size-4" /> : <Send className="size-4" />}
              Posting
            </button>
          </div>
        </form>

        <ConfirmDialog
          open={confirmPost}
          title="Posting aktivitas ini?"
          description="Aktivitas dan foto akan langsung terlihat oleh semua orang."
          confirmLabel="Posting"
          onConfirm={submitActivity}
          onCancel={() => setConfirmPost(false)}
        />

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Aktivitas saya</h2>

          {activities === null && (
            <div className="flex justify-center py-16 text-neutral-400 dark:text-neutral-500">
              <Spinner className="size-6" />
            </div>
          )}

          {activities?.length === 0 && (
            <EmptyState icon={ImagePlus} title="Belum ada aktivitas" subtitle="Posting aktivitas pertamamu di atas." />
          )}

          <div className="flex flex-col gap-4">
            {activities?.map((a) => (
              <ActivityCard key={a.id} activity={a} onDelete={() => setConfirmDeleteId(a.id)} />
            ))}
          </div>

          <ConfirmDialog
            open={!!confirmDeleteId}
            title="Hapus aktivitas ini?"
            description="Aktivitas dan semua foto di dalamnya akan dihapus permanen."
            confirmLabel="Hapus"
            danger
            onConfirm={handleDelete}
            onCancel={() => setConfirmDeleteId(null)}
          />

          {activities !== null && hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-6 text-neutral-400 dark:text-neutral-500">
              <Spinner className="size-6" />
            </div>
          )}

          {activities !== null && !hasMore && activities.length > 0 && (
            <p className="text-center text-sm text-neutral-400 dark:text-neutral-600 py-6">Sudah mencapai akhir.</p>
          )}
        </section>
      </main>
    </div>
  );
}
