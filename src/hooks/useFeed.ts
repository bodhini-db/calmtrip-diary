import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { getFirstPhotoPublicUrlByTripIds } from '@/lib/api';

export interface FeedEntry {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  created_at: string;
  location?: string | null;
  distance_km?: number | null;
  duration_minutes?: number | null;
  /** First trip photo from `photos` table (earliest `taken_at`), for feed hero image */
  cover_image_url?: string | null;
  profiles?: Array<{
    username: string;
    avatar_url?: string | null;
  }> | null;
}

export const useFeed = () => {
  const { user } = useAuth();

  return useQuery<FeedEntry[], Error>({
    queryKey: ['feed', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: follows, error: followsError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followsError) {
        if (followsError.message?.includes('does not exist')) {
          console.warn('Supabase follows table is missing. Falling back to recent trips.');
        } else {
          throw followsError;
        }
      }

      const followingIds = follows?.map((row) => row.following_id) ?? [];
      if (!followingIds.length) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', followingIds);

      if (profilesError) {
        if (!profilesError.message?.includes('does not exist')) {
          throw profilesError;
        }
      }

      const profileMap = new Map<string, { username: string; avatar_url?: string | null }>();
      (profiles || []).forEach((profile: any) => {
        profileMap.set(profile.id, {
          username: profile.username,
          avatar_url: profile.avatar_url,
        });
      });

      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select('id, user_id, origin, destination, purpose, created_at, distance_km, duration_minutes')
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (tripsError) throw tripsError;

      const tripList = trips || [];
      const tripIds = tripList.map((t: { id: string }) => t.id);

      let photoByTrip = new Map<string, string>();
      try {
        photoByTrip = await getFirstPhotoPublicUrlByTripIds(tripIds);
      } catch (e) {
        console.warn('Feed: could not load photos for trips (check RLS policy for followers):', e);
      }

      const mapped = tripList.map((trip: any) => {
        const profile = profileMap.get(trip.user_id);
        return {
          id: trip.id,
          user_id: trip.user_id,
          title: trip.destination || trip.origin || 'Journey',
          description: trip.purpose || 'Travel journal entry',
          location: trip.destination || trip.origin || undefined,
          created_at: trip.created_at,
          distance_km: trip.distance_km ?? null,
          duration_minutes: trip.duration_minutes ?? null,
          cover_image_url: photoByTrip.get(trip.id) ?? null,
          profiles: profile ? [{ username: profile.username, avatar_url: profile.avatar_url }] : null,
        };
      });

      return mapped as FeedEntry[];
    },
    enabled: !!user?.id,
    initialData: [],
  });
};
