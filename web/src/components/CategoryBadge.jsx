import { categoryMeta } from '../lib/categories';

export default function CategoryBadge({ category, size = 'sm' }) {
  const meta = categoryMeta(category);
  const Icon = meta.icon;
  const pad = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ring-1 font-medium ${meta.bg} ${meta.color} ${meta.ring} ${pad}`}
    >
      <Icon className={size === 'sm' ? 'size-3.5' : 'size-4'} strokeWidth={2.25} />
      {meta.label}
    </span>
  );
}
