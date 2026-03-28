import { useEffect, useState, type ChangeEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useIsFollowing, useFollowMutation } from '@/hooks/useFollow';
import { getTrips, uploadProfileAvatar } from '@/lib/api';
import { Clock, MapPin } from 'lucide-react';

export default function Profile() {
  const { user, loading } = useAuth();
  const params = useParams();
  const userId = params.userId;
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useUserProfile(userId);
  const { data: isFollowing = false, isLoading: isFollowingLoading } = useIsFollowing(userId ?? '');
  const { follow, unfollow } = useFollowMutation();
  const [trips, setTrips] = useState<any[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);

  const isOwnProfile = userId === user?.id;
  const queryClient = useQueryClient();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setAvatarUploadError(null);
    setAvatarFile(file);
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile || !userId) return;
    setUploadingAvatar(true);
    setAvatarUploadError(null);

    try {
      await uploadProfileAvatar(userId, avatarFile);
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['users'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['feed'], exact: false });
      setAvatarFile(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload avatar';
      setAvatarUploadError(message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      setLoadingTrips(true);
      try {
        const data = await getTrips(userId);
        setTrips(data);
      } catch {
        setTrips([]);
      } finally {
        setLoadingTrips(false);
      }
    };
    load();
  }, [userId]);

  const handleFollow = async () => {
    if (!userId) return;
    try {
      if (isFollowing) {
        await unfollow.mutateAsync(userId);
      } else {
        await follow.mutateAsync(userId);
      }
    } catch {
      // ignore
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-soft">
          <h1 className="text-2xl font-semibold text-foreground">Profile not found</h1>
          <p className="text-sm text-muted-foreground mt-3">This traveler may not exist yet.</p>
          <Button variant="outline" className="mt-6" onClick={() => navigate('/discover')}>
            Back to discover
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="safe-top px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                {profile.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={profile.username} />
                ) : (
                  <AvatarFallback>{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
                )}
              </Avatar>
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground">{profile.full_name || profile.username}</h1>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
                {isOwnProfile && (
                  <div className="mt-3 flex flex-col gap-3">
                    <label className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground cursor-pointer">
                      <span>{avatarFile?.name || 'Choose avatar image'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </label>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleUploadAvatar}
                        disabled={!avatarFile || uploadingAvatar}
                        variant="outline"
                      >
                        {uploadingAvatar ? 'Uploading...' : 'Upload avatar'}
                      </Button>
                      {avatarFile && !uploadingAvatar && (
                        <span className="text-xs text-muted-foreground">Ready to upload</span>
                      )}
                    </div>
                    {avatarUploadError && (
                      <p className="text-xs text-destructive">{avatarUploadError}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {!isOwnProfile && (
              <Button
                onClick={handleFollow}
                disabled={isFollowingLoading || follow.status === 'pending' || unfollow.status === 'pending'}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>

          {profile.bio && (
            <Card className="p-4 bg-card border border-border">
              <p className="text-sm text-muted-foreground">{profile.bio}</p>
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-4 border border-border bg-card">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Journeys</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{trips.length}</p>
            </Card>
            <Card className="p-4 border border-border bg-card">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Followers</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{profile.followers_count ?? 0}</p>
            </Card>
            <Card className="p-4 border border-border bg-card">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Joined</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {profile.created_at
                  ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                  : '—'}
              </p>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Recent trips</h2>
                <p className="text-sm text-muted-foreground">See this traveler's latest journal entries.</p>
              </div>
              <Link to="/feed">
                <Button variant="outline">Back to feed</Button>
              </Link>
            </div>

            {loadingTrips ? (
              <p className="text-muted-foreground">Loading trips...</p>
            ) : trips.length === 0 ? (
              <Card className="p-6 bg-card border border-border text-center">
                <p className="text-sm text-muted-foreground">No trips published yet.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {trips.map((trip) => (
                  <Card key={trip.id} className="p-4 border border-border bg-card">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{trip.destination || trip.origin || 'Trip'}</h3>
                        <p className="text-sm text-muted-foreground">{new Date(trip.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{trip.destination || trip.origin || 'Unknown'}</span>
                        <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{trip.duration_minutes ?? 0} min</span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{trip.purpose || 'Travel journal entry'}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
