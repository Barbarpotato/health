import { useCallback, useEffect, useRef, useState } from 'react';
import { Users } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import ActivityCard from '../components/ActivityCard';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';
import { api } from '../lib/api';
import { getUser } from '../lib/auth';

const PAGE_SIZE = 10;

export default function Feed() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const offsetRef = useRef(0);
  const loadingRef = useRef(false);
  const sentinelRef = useRef(null);
  const user = getUser();

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoading(true);
    setLoadError(false);

    try {
      const res = await api(`/activities?limit=${PAGE_SIZE}&offset=${offsetRef.current}`);
      setActivities((prev) => [...prev, ...res.data]);
      offsetRef.current += res.data.length;
      setHasMore(offsetRef.current < res.count);
    } catch (err) {
      setLoadError(true);
      setHasMore(false);
      toast.error('Gagal memuat aktivitas.');
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [hasMore]);

  useEffect(() => {
    loadMore();
  }, []);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '400px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="min-h-screen">
      <Navbar
        user={null}
        links={user ? [{ to: '/dashboard', label: 'Aktivitas saya' }] : [{ to: '/', label: 'Masuk' }]}
      />

      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-8 flex flex-col gap-4">
        <div>
          {user && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Hello, {user.full_name}</p>
          )}
          <h1 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Lihat aktivitas semua orang
          </h1>
        </div>

        {!loading && activities.length === 0 && <EmptyState icon={Users} title="Belum ada aktivitas" />}

        <div className="flex flex-col gap-4">
          {activities.map((a) => (
            <ActivityCard key={a.id} activity={a} showAuthor />
          ))}
        </div>

        {hasMore && (
          <div ref={sentinelRef} className="flex justify-center py-6 text-neutral-500">
            <Spinner className="size-6" />
          </div>
        )}

        {!hasMore && !loadError && activities.length > 0 && (
          <p className="text-center text-sm text-neutral-400 dark:text-neutral-600 py-6">Sudah mencapai akhir.</p>
        )}

        {loadError && (
          <EmptyState icon={Users} title="Gagal memuat aktivitas" subtitle="Coba muat ulang halaman." />
        )}
      </main>
    </div>
  );
}
