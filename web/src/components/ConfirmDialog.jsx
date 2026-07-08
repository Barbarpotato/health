import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Ya',
  cancelLabel = 'Batal',
  onConfirm,
  onCancel,
  danger = false,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div className="glass rounded-2xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
        {description && (
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
              danger ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-to-r from-indigo-500 to-pink-500 hover:brightness-110'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
