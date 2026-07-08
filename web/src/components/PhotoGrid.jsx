import { useState } from 'react';
import { X } from 'lucide-react';

export default function PhotoGrid({ photos, size = 96 }) {
  const [lightbox, setLightbox] = useState(null);

  if (!photos || photos.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {photos.map((p) => (
          <button
            key={p.id}
            onClick={() => setLightbox(p.url)}
            className="overflow-hidden rounded-xl ring-1 ring-white/10 hover:ring-white/30 transition"
            style={{ width: size, height: size }}
          >
            <img src={p.url} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-6 right-6 text-white/70 hover:text-white">
            <X className="size-7" />
          </button>
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-2xl shadow-2xl" />
        </div>
      )}
    </>
  );
}
