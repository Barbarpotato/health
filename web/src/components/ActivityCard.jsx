import { useState } from 'react';
import { Trash2 } from 'lucide-react';
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
  const sections = [
    { category: activity.category, photos: activity.photos },
    ...(activity.children || []).map((c) => ({ category: c.category, photos: c.photos })),
  ];
  const [activeCategory, setActiveCategory] = useState(activity.category);
  const activeSection = sections.find((s) => s.category === activeCategory) || sections[0];

  const totalPoints = (activity.points || 0) + (activity.children || []).reduce((sum, c) => sum + (c.points || 0), 0);
  const locked = activity.points > 0 || activity.children?.some((c) => c.points > 0);
  const meta = categoryMeta(activity.category);

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
          {onDelete && !locked && (
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

      {activeSection.photos?.length > 0 && <PhotoGrid photos={activeSection.photos} size="full" />}

      {activity.caption && (
        <p className="mt-3 text-sm text-neutral-800 dark:text-neutral-100 leading-relaxed">{activity.caption}</p>
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
    </div>
  );
}
