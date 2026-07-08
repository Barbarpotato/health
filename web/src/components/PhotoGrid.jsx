import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function PhotoGrid({ photos, size = 96 }) {
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => e.key === 'Escape' && setLightbox(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  if (!photos || photos.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {photos.map((p) => (
          <button
            key={p.id}
            onClick={() => setLightbox(p.url)}
            className="overflow-hidden rounded-xl ring-1 ring-black/10 dark:ring-white/10 hover:ring-black/30 dark:hover:ring-white/30 transition"
            style={{ width: size, height: size }}
          >
            <img src={p.url} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 z-10 text-white/70 hover:text-white"
          >
            <X className="size-8" />
          </button>
          <img src={lightbox} alt="" className="max-w-full max-h-full w-full h-full object-contain" />
        </div>
      )}
    </>
  );
}
