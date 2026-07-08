import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImagePlus, X, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import ActivityCard from '../components/ActivityCard';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';
import { CATEGORIES } from '../lib/categories';
import { api, ApiError } from '../lib/api';
import { getUser, clearUser } from '../lib/auth';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user] = useState(getUser());
  const [activities, setActivities] = useState(null);
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadActivities();
  }, []);

  async function loadActivities() {
    const data = await api(`/activities?user_id=${user.id}`);
    setActivities(data);
  }

  function addFiles(newFiles) {
    setFiles((prev) => [...prev, ...Array.from(newFiles)]);
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (files.length === 0) {
      toast.error('Add at least 1 photo before posting.');
      return;
    }

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

      toast.success('Activity posted!');
      setCaption('');
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadActivities();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to post activity');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    await api(`/activities/${id}`, { method: 'DELETE' });
    loadActivities();
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
        links={[{ to: '/feed', label: 'Everyone' }]}
      />

      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-8 flex flex-col gap-8">
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-5 flex flex-col gap-4">
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
                    active ? `${c.bg} ${c.color} ${c.ring}` : 'ring-white/5 text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  <Icon className="size-5" strokeWidth={2} />
                  {c.label}
                </button>
              );
            })}
          </div>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="What did you do?"
            rows={2}
            className="w-full resize-none rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div key={i} className="relative size-16 rounded-lg overflow-hidden ring-1 ring-white/10">
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
            <label className="flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-200 cursor-pointer transition">
              <ImagePlus className="size-4" />
              {files.length === 0 ? 'Add photos (required)' : `${files.length} photo${files.length > 1 ? 's' : ''} selected`}
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
              disabled={submitting || files.length === 0}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 hover:brightness-110 transition"
            >
              {submitting ? <Spinner className="size-4" /> : <Send className="size-4" />}
              Post
            </button>
          </div>
        </form>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-neutral-400">My activities</h2>

          {activities === null && (
            <div className="flex justify-center py-16 text-neutral-500">
              <Spinner className="size-6" />
            </div>
          )}

          {activities?.length === 0 && (
            <EmptyState icon={ImagePlus} title="No activities yet" subtitle="Post your first activity above." />
          )}

          <div className="flex flex-col gap-4">
            {activities?.map((a) => (
              <ActivityCard key={a.id} activity={a} onDelete={handleDelete} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
