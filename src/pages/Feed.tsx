import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FeedCard } from '@/components/FeedCard';
import { useFeed } from '@/hooks/useFeed';
import { useAuth } from '@/hooks/useAuth';

export default function Feed() {
  const { user, loading } = useAuth();
  const { data: feed = [], isLoading } = useFeed();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🧳</div>
          <p className="text-muted-foreground">Loading your feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="safe-top px-4 py-5">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Community</p>
            <h1 className="mt-2 text-3xl font-display font-bold text-foreground">Your Feed</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Discover the latest journeys from people you follow.
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-44 rounded-3xl" />
              <Skeleton className="h-44 rounded-3xl" />
              <Skeleton className="h-44 rounded-3xl" />
            </div>
          ) : feed.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card p-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-mint text-2xl">
                <Compass className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Your feed is empty</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Follow travelers to see their journeys here.
              </p>
              <Link to="/discover">
                <Button variant="calm">Find travelers</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {feed.map((entry) => (
                <FeedCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
