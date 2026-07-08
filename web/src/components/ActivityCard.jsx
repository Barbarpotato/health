import { Trash2, Salad } from 'lucide-react';
import CategoryBadge from './CategoryBadge';
import PhotoGrid from './PhotoGrid';
import { categoryMeta } from '../lib/categories';

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)}mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}jam lalu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}hr lalu`;
  return new Date(iso).toLocaleDateString('id-ID');
}

export default function ActivityCard({ activity, showAuthor = false, onDelete }) {
  const meta = categoryMeta(activity.category);

  return (
    <div className={`glass rounded-2xl p-5 bg-gradient-to-br ${meta.gradient} relative group`}>
      {showAuthor && activity.users && (
        <p className="font-semibold text-base text-neutral-900 dark:text-white mb-2">{activity.users.full_name}</p>
      )}

      <div className="flex items-start justify-between gap-3">
        <CategoryBadge category={activity.category} />
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
            {timeAgo(activity.created_at)}
          </span>
          {onDelete && (
            <button
              onClick={() => onDelete(activity.id)}
              className="opacity-0 group-hover:opacity-100 transition text-neutral-500 dark:text-neutral-400 hover:text-red-500 dark:hover:text-red-400"
              title="Hapus aktivitas"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>

      {activity.caption && (
        <p className="mt-3 text-sm text-neutral-800 dark:text-neutral-100 leading-relaxed">{activity.caption}</p>
      )}

      {activity.photos?.length > 0 && (
        <div className="mt-3">
          <PhotoGrid photos={activity.photos} />
        </div>
      )}

      {activity.children?.map((child) => (
        <div key={child.id} className="mt-4 pt-4 border-t border-black/10 dark:border-white/10">
          <CategoryBadge category={child.category} />
          {child.photos?.length > 0 && (
            <div className="mt-3">
              <PhotoGrid photos={child.photos} />
            </div>
          )}
        </div>
      ))}

      {!activity.children?.length && (
        <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10 flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-600 italic">
          <Salad className="size-3.5" />
          Mindful nutrition belum tercatat (data lama)
        </div>
      )}
    </div>
  );
}
