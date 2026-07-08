import { Trash2 } from 'lucide-react';
import CategoryBadge from './CategoryBadge';
import PhotoGrid from './PhotoGrid';
import { categoryMeta } from '../lib/categories';

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function ActivityCard({ activity, showAuthor = false, onDelete }) {
  const meta = categoryMeta(activity.category);

  return (
    <div className={`glass rounded-2xl p-5 bg-gradient-to-br ${meta.gradient} relative group`}>
      <div className="flex items-start justify-between gap-3">
        <CategoryBadge category={activity.category} />
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400 whitespace-nowrap">{timeAgo(activity.created_at)}</span>
          {onDelete && (
            <button
              onClick={() => onDelete(activity.id)}
              className="opacity-0 group-hover:opacity-100 transition text-neutral-400 hover:text-red-400"
              title="Delete activity"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>

      {activity.caption && <p className="mt-3 text-sm text-neutral-100 leading-relaxed">{activity.caption}</p>}

      {showAuthor && activity.users && (
        <p className="mt-1 text-xs text-neutral-400">by {activity.users.full_name}</p>
      )}

      {activity.photos?.length > 0 && (
        <div className="mt-3">
          <PhotoGrid photos={activity.photos} />
        </div>
      )}
    </div>
  );
}
