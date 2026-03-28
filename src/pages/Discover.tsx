import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCard } from '@/components/UserCard';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';

export default function Discover() {
  const { user, loading } = useAuth();
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const debounce = window.setTimeout(() => setSearch(query), 300);
    return () => window.clearTimeout(debounce);
  }, [query]);

  const { data: users = [], isLoading } = useUsers(search);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🧳</div>
          <p className="text-muted-foreground">Loading discover...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="safe-top px-4 py-5">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Discover</p>
            <h1 className="mt-2 text-3xl font-display font-bold text-foreground">Find travelers</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Search and follow people to see their travel entries in your feed.
            </p>
          </div>

          <div className="mb-6">
            <div className="relative max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search travelers"
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-40 rounded-3xl" />
              <Skeleton className="h-40 rounded-3xl" />
              <Skeleton className="h-40 rounded-3xl" />
              <Skeleton className="h-40 rounded-3xl" />
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card p-10 text-center">
              <h2 className="text-xl font-semibold text-foreground mb-2">No travelers found</h2>
              <p className="text-sm text-muted-foreground">
                Try changing your search or follow a few people to fill this page.
              </p>
              <Link to="/feed">
                <Button variant="calm" className="mt-6">
                  Back to feed
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {users.map((profile) => (
                <UserCard key={profile.id} user={profile} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
