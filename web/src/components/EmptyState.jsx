export default function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-neutral-500 dark:text-neutral-400">
      {Icon && <Icon className="size-10 text-neutral-400 dark:text-neutral-600" strokeWidth={1.5} />}
      <p className="text-neutral-800 dark:text-neutral-200 font-medium">{title}</p>
      {subtitle && <p className="text-sm max-w-xs">{subtitle}</p>}
    </div>
  );
}
