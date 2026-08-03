import { useEffect, useRef, useState } from 'react';
import { Trash2, Pencil, Check, X, ImagePlus } from 'lucide-react';
import CategoryBadge from './CategoryBadge';
import PhotoGrid from './PhotoGrid';
import Spinner from './Spinner';
import ConfirmDialog from './ConfirmDialog';
import { categoryMeta } from '../lib/categories';
import { isVideo } from '../lib/upload';

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)}mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}jam lalu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}hr lalu`;
  return new Date(iso).toLocaleDateString('id-ID');
}

export default function ActivityCard({
  activity,
  showAuthor = false,
  onDelete,
  onEditCaption,
  onDeletePhoto,
  onAddPhotos,
}) {
  const sections = [
    { category: activity.category, photos: activity.photos, id: activity.id },
    ...(activity.children || []).map((c) => ({ category: c.category, photos: c.photos, id: c.id })),
  ];
  const [activeCategory, setActiveCategory] = useState(activity.category);
  const activeSection = sections.find((s) => s.category === activeCategory) || sections[0];

  const [editing, setEditing] = useState(false);
  const [captionDraft, setCaptionDraft] = useState(activity.caption || '');
  const captionRef = useRef(null);

  useEffect(() => {
    if (!editing || !captionRef.current) return;
    captionRef.current.style.height = 'auto';
    captionRef.current.style.height = `${captionRef.current.scrollHeight}px`;
  }, [editing, captionDraft]);
  const [saving, setSaving] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [confirmDeletePhotoId, setConfirmDeletePhotoId] = useState(null);

  const totalPoints = (activity.points || 0) + (activity.children || []).reduce((sum, c) => sum + (c.points || 0), 0);
  const locked = activity.points > 0 || activity.children?.some((c) => c.points > 0);
  const meta = categoryMeta(activity.category);

  async function handleSaveCaption() {
    setSaving(true);
    try {
      await onEditCaption(activity.id, captionDraft.trim());
      setEditing(false);
    } catch {
      // stay in edit mode — caller already surfaced the error via toast
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePhoto() {
    const photoId = confirmDeletePhotoId;
    setConfirmDeletePhotoId(null);
    setDeletingPhotoId(photoId);
    try {
      await onDeletePhoto(photoId, activity.id);
    } catch {
      // caller already surfaced the error via toast
    } finally {
      setDeletingPhotoId(null);
    }
  }

  async function handleAddPhotos(e) {
    const files = Array.from(e.target.files);
    e.target.value = '';
    if (files.length === 0) return;
    setUploadingPhotos(true);
    try {
      await onAddPhotos(activeSection.id, activity.id, files);
    } catch {
      // caller already surfaced the error via toast
    } finally {
      setUploadingPhotos(false);
    }
  }

  return (
    <div className={`glass rounded-2xl p-5 bg-gradient-to-br ${meta.gradient} relative group`}>
      {showAuthor && activity.users && (
        <p className="font-semibold text-base text-neutral-900 dark:text-white mb-2">{activity.users.full_name}</p>
      )}

      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
          {timeAgo(activity.created_at)}
        </span>
        <div className="flex items-center gap-2">
          {totalPoints > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-400/30 px-2.5 py-1 text-xs font-medium">
              +{totalPoints} poin
            </span>
          )}
          {onEditCaption && !locked && !editing && (
            <button
              onClick={() => {
                setCaptionDraft(activity.caption || '');
                setEditing(true);
              }}
              className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition text-neutral-500 dark:text-neutral-400 hover:text-indigo-500 dark:hover:text-indigo-400"
              title="Edit postingan"
            >
              <Pencil className="size-4" />
            </button>
          )}
          {onDelete && !locked && (
            <button
              onClick={() => onDelete(activity.id)}
              className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition text-neutral-500 dark:text-neutral-400 hover:text-red-500 dark:hover:text-red-400"
              title="Hapus aktivitas"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="flex flex-wrap gap-2">
          {(activeSection.photos || []).map((p) => (
            <div key={p.id} className="relative size-16 rounded-lg overflow-hidden ring-1 ring-black/10 dark:ring-white/10">
              {isVideo(p.url) ? (
                <video src={p.url} className="h-full w-full object-cover" muted />
              ) : (
                <img src={p.url} alt="" className="h-full w-full object-cover" />
              )}
              <button
                type="button"
                disabled={deletingPhotoId === p.id}
                onClick={() => setConfirmDeletePhotoId(p.id)}
                title="Hapus foto"
                className="absolute top-1 right-1 flex items-center justify-center size-5 rounded-full bg-black/60 text-white hover:bg-red-500 transition"
              >
                {deletingPhotoId === p.id ? <Spinner className="size-3" /> : <X className="size-3" />}
              </button>
            </div>
          ))}
          <label className="flex items-center justify-center size-16 rounded-lg border-2 border-dashed border-black/15 dark:border-white/15 text-neutral-400 dark:text-neutral-500 cursor-pointer transition hover:bg-black/[0.03] dark:hover:bg-white/5">
            {uploadingPhotos ? <Spinner className="size-4" /> : <ImagePlus className="size-4" />}
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleAddPhotos}
              disabled={uploadingPhotos}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        activeSection.photos?.length > 0 && <PhotoGrid photos={activeSection.photos} size="full" />
      )}

      {editing ? (
        <div className="mt-3 flex flex-col gap-2">
          <textarea
            ref={captionRef}
            autoFocus
            value={captionDraft}
            onChange={(e) => setCaptionDraft(e.target.value)}
            rows={1}
            className="w-full resize-none overflow-hidden rounded-xl bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          <div className="flex items-center gap-2">
            <button
              disabled={saving}
              onClick={handleSaveCaption}
              className="flex items-center gap-1 rounded-lg bg-indigo-500 px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-40 hover:brightness-110 transition"
            >
              <Check className="size-3.5" />
              Simpan
            </button>
            <button
              disabled={saving}
              onClick={() => setEditing(false)}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-500 hover:bg-black/5 dark:hover:bg-white/5 transition"
            >
              <X className="size-3.5" />
              Batal
            </button>
          </div>
        </div>
      ) : (
        activity.caption && (
          <p className="mt-3 text-sm text-neutral-800 dark:text-neutral-100 leading-relaxed">{activity.caption}</p>
        )
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {sections.map((s) => (
          <button
            key={s.category}
            onClick={() => setActiveCategory(s.category)}
            className={`rounded-full transition ${
              s.category === activeCategory ? 'ring-2 ring-offset-1 ring-offset-transparent' : 'opacity-60 hover:opacity-100'
            }`}
          >
            <CategoryBadge category={s.category} />
          </button>
        ))}
      </div>

      <ConfirmDialog
        open={confirmDeletePhotoId !== null}
        title="Hapus foto ini?"
        description="Foto akan dihapus permanen dari postingan ini."
        confirmLabel="Hapus"
        danger
        onConfirm={handleDeletePhoto}
        onCancel={() => setConfirmDeletePhotoId(null)}
      />
    </div>
  );
}
