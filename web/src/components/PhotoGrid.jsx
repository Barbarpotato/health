import { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Play, ImageIcon } from 'lucide-react';
import { isVideo } from '../lib/upload';
import CategoryBadge from './CategoryBadge';

function VideoBadge({ size }) {
  return (
    <span
      className={`pointer-events-none absolute inset-0 flex items-center justify-center ${
        size === 'full' ? '' : 'bg-black/10'
      }`}
    >
      <span className="flex items-center justify-center rounded-full bg-black/50 text-white size-8">
        <Play className="size-4 fill-white" strokeWidth={0} />
      </span>
    </span>
  );
}

export default function PhotoGrid({ photos, size = 96 }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollerRef = useRef(null);

  function handleScroll(e) {
    const el = e.currentTarget;
    setActiveIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  function goToIndex(i) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  }

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => Math.max(i - 1, 0));
      if (e.key === 'ArrowRight') setLightboxIndex((i) => Math.min(i + 1, photos.length - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, photos]);

  if (!photos || photos.length === 0) return null;

  const lightboxPhoto = lightboxIndex === null ? null : photos[lightboxIndex];

  return (
    <>
      {size === 'icon' ? (
        <button
          onClick={() => setLightboxIndex(0)}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-neutral-500 ring-1 ring-black/10 dark:ring-white/10 hover:bg-black/5 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white transition"
        >
          <ImageIcon className="size-3.5" />
          {photos.length}
        </button>
      ) : size === 'full' ? (
        <div className="relative group">
          <div
            ref={scrollerRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto snap-x snap-mandatory rounded-2xl ring-1 ring-black/10 dark:ring-white/10 no-scrollbar"
          >
            {photos.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setLightboxIndex(i)}
                className="relative w-full flex-shrink-0 snap-center aspect-square"
              >
                {isVideo(p.url) ? (
                  <>
                    <video src={p.url} className="h-full w-full object-cover" muted preload="none" />
                    <VideoBadge size="full" />
                  </>
                ) : (
                  <img src={p.url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                )}
              </button>
            ))}
          </div>

          {photos.length > 1 && (
            <>
              <span className="pointer-events-none absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                {activeIndex + 1}/{photos.length}
              </span>

              {activeIndex > 0 && (
                <button
                  onClick={() => goToIndex(activeIndex - 1)}
                  aria-label="Foto sebelumnya"
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center size-8 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-black/70 transition"
                >
                  <ChevronLeft className="size-5" />
                </button>
              )}
              {activeIndex < photos.length - 1 && (
                <button
                  onClick={() => goToIndex(activeIndex + 1)}
                  aria-label="Foto berikutnya"
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center size-8 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-black/70 transition"
                >
                  <ChevronRight className="size-5" />
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {photos.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setLightboxIndex(i)}
              className="relative overflow-hidden rounded-xl ring-1 ring-black/10 dark:ring-white/10 hover:ring-black/30 dark:hover:ring-white/30 transition"
              style={{ width: size, height: size }}
            >
              {isVideo(p.url) ? (
                <>
                  <video src={p.url} className="h-full w-full object-cover" muted preload="none" />
                  <VideoBadge />
                </>
              ) : (
                <img src={p.url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}

      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 z-10 text-white/70 hover:text-white"
          >
            <X className="size-8" />
          </button>

          <div className="pointer-events-none absolute top-4 left-4 z-10 flex items-center gap-2">
            {lightboxPhoto.category && <CategoryBadge category={lightboxPhoto.category} />}
            {photos.length > 1 && (
              <span className="rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
                {lightboxIndex + 1}/{photos.length}
              </span>
            )}
          </div>

          {lightboxIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => i - 1);
              }}
              aria-label="Foto sebelumnya"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center size-10 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
            >
              <ChevronLeft className="size-6" />
            </button>
          )}
          {lightboxIndex < photos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => i + 1);
              }}
              aria-label="Foto berikutnya"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center size-10 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
            >
              <ChevronRight className="size-6" />
            </button>
          )}

          {isVideo(lightboxPhoto.url) ? (
            <video
              src={lightboxPhoto.url}
              controls
              autoPlay
              className="max-w-full max-h-full w-full h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={lightboxPhoto.url}
              alt=""
              className="max-w-full max-h-full w-full h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </>
  );
}
