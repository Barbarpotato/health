import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import Navbar from '../components/Navbar';
import ActivityCard from '../components/ActivityCard';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';
import { api } from '../lib/api';
import { getUser } from '../lib/auth';

export default function Feed() {
  const [activities, setActivities] = useState(null);
  const user = getUser();

  useEffect(() => {
    api('/activities').then(setActivities);
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar user={null} links={user ? [{ to: '/dashboard', label: 'My dashboard' }] : [{ to: '/', label: 'Log in' }]} />

      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-8 flex flex-col gap-4">
        <h1 className="text-lg font-semibold tracking-tight">Everyone's activity</h1>

        {activities === null && (
          <div className="flex justify-center py-16 text-neutral-500">
            <Spinner className="size-6" />
          </div>
        )}

        {activities?.length === 0 && <EmptyState icon={Users} title="No activity yet" />}

        <div className="flex flex-col gap-4">
          {activities?.map((a) => (
            <ActivityCard key={a.id} activity={a} showAuthor />
          ))}
        </div>
      </main>
    </div>
  );
}
