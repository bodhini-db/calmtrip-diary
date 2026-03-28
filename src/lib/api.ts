import { supabase, Trip, Photo, TripCheckpointMeta } from './supabase';

// ── Profile API ───────────────────────────────────────────────────

export interface UserProfile {
  full_name?: string;
  avatar_url?: string;
}

export const getProfileFromUser = (user: { user_metadata?: Record<string, unknown> }): UserProfile => ({
  full_name: (user.user_metadata?.full_name as string) || undefined,
  avatar_url: (user.user_metadata?.avatar_url as string) || undefined,
});

export const updateProfile = async (updates: { full_name?: string; avatar_url?: string }) => {
  const { data: userData } = await supabase.auth.getUser();
  let authUser = userData?.user ?? null;
  try {
    const { data } = await supabase.auth.updateUser({ data: updates });
    authUser = data.user ?? authUser;
  } catch (e) { void e; }
  const profileUpdates: Record<string, string | null> = {};
  if (typeof updates.full_name !== 'undefined') profileUpdates.full_name = updates.full_name || null;
  if (typeof updates.avatar_url !== 'undefined') profileUpdates.avatar_url = updates.avatar_url || null;
  if (authUser?.id && Object.keys(profileUpdates).length > 0) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', authUser.id);
    if (profileError) throw profileError;
  }
  return authUser;
};

/**
 * Upload profile avatar to Storage under `{userId}/...` so Supabase Storage RLS
 * policies that require the first path segment to equal `auth.uid()` work on every host (incl. Vercel).
 * Also updates `profiles.avatar_url` so the feed and other screens stay in sync with auth metadata.
 */
export const uploadAvatar = async (userId: string, file: File): Promise<string> => {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/avatar.${ext}`;
  const contentType = file.type?.trim() || 'image/jpeg';

  const { error: uploadError } = await supabase.storage.from('photos').upload(path, file, {
    contentType,
    upsert: true,
    cacheControl: '3600',
  });

  if (uploadError) throw uploadError;

  const publicUrl = getPhotoPublicUrl(path);

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId);

  if (profileError) {
    console.warn('profiles.avatar_url update failed (avatar still in storage):', profileError.message);
  }

  return publicUrl;
};

// ── Trip API ──────────────────────────────────────────────────

export const createTrip = async (
  trip: Omit<Trip, 'id' | 'created_at'>
) => {
  const { data, error } = await supabase
    .from('trips')
    .insert([trip])
    .select()
    .single();
  if (error) throw error;
  return data as Trip;
};

export const getTrips = async (userId: string) => {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Trip[];
};

export const getTripById = async (tripId: string) => {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();
  if (error) throw error;
  return data as Trip;
};

export const getTripLikeCount = async (tripId: string) => {
  const { count, error } = await supabase
    .from('trip_likes')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', tripId);
  if (error && !error.message?.includes('does not exist')) throw error;
  return count ?? 0;
};

export const getTripCommentCount = async (tripId: string) => {
  const { count, error } = await supabase
    .from('trip_comments')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', tripId);
  if (error && !error.message?.includes('does not exist')) throw error;
  return count ?? 0;
};

export const toggleTripLike = async (tripId: string, userId: string, shouldLike: boolean) => {
  if (shouldLike) {
    const { error } = await supabase.from('trip_likes').insert([
      { trip_id: tripId, user_id: userId },
    ]);
    if (error && !error.message?.includes('duplicate key value')) throw error;
    return true;
  }

  const { error } = await supabase
    .from('trip_likes')
    .delete()
    .eq('trip_id', tripId)
    .eq('user_id', userId);
  if (error && !error.message?.includes('does not exist')) throw error;
  return false;
};

export const addTripComment = async (tripId: string, userId: string, comment: string) => {
  const { data, error } = await supabase.from('trip_comments').insert([
    {
      trip_id: tripId,
      user_id: userId,
      comment,
    },
  ]).select().single();

  if (error && !error.message?.includes('does not exist')) throw error;
  return data;
};

/**
 * Delete a trip and all its associated data:
 * - All photos from storage
 * - All photo records from database
 * - The trip record itself
 */
export const deleteTrip = async (tripId: string) => {
  const photos = await getTripPhotosList(tripId);
  const storagePaths = photos.map(p => p.storage_path).filter(Boolean);
  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from('photos')
      .remove(storagePaths);
    if (storageError) {
      console.warn('Failed to delete some photos from storage:', storageError);
      // Continue with database deletion even if storage deletion fails
    }
  }

  if (photos.length > 0) {
    const { error: photosError } = await supabase
      .from('photos')
      .delete()
      .eq('trip_id', tripId);
    if (photosError) throw photosError;
  }

  const { error: tripError } = await supabase
    .from('trips')
    .delete()
    .eq('id', tripId);
  if (tripError) throw tripError;
};

// ── Photo API ─────────────────────────────────────────────────

/**
 * Upload a photo file to Supabase Storage and insert a record in the photos table.
 */
export const uploadTripPhoto = async (
  userId: string,
  tripId: string,
  checkpointId: string,
  file: File,
  caption: string | undefined,
  lat: number,
  lng: number
) => {
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${userId}/${tripId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(fileName, file, { contentType: file.type });

  if (uploadError) throw uploadError;

  // photos table columns: id, user_id, trip_id, storage_path, latitude (NOT NULL), longitude (NOT NULL)
  // Optional columns: checkpoint_id, caption, taken_at, emoji_mood
  const { data: photoData, error: photoError } = await supabase
    .from('photos')
    .insert([{
      user_id: userId,
      trip_id: tripId,
      storage_path: fileName,
      latitude: lat,
      longitude: lng,
      checkpoint_id: checkpointId || null,
      caption: caption || null,
      taken_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (photoError) throw photoError;
  return photoData as Photo;
};

/** Returns all photos for a trip (ordered by id; add taken_at column in DB for time order). */
export const getTripPhotosList = async (tripId: string) => {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('trip_id', tripId)
    .order('id', { ascending: true });
  if (error) throw error;
  return data as Photo[];
};

/** @deprecated use uploadTripPhoto + getTripPhotosList */
export const uploadPhoto = async (
  userId: string,
  tripId: string,
  file: File,
  latitude: number,
  longitude: number
) => {
  return uploadTripPhoto(userId, tripId, '', file, undefined, latitude, longitude);
};

export const uploadProfileAvatar = async (userId: string, file: File) => {
  const ext = file.name.split('.').pop() || 'jpg';
  /** First folder must be `userId` for Storage policies that match auth.uid() to folder[0]. */
  const fileName = `${userId}/profile/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const contentType = file.type?.trim() || 'image/jpeg';

  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(fileName, file, { contentType, upsert: true, cacheControl: '3600' });
  if (uploadError) throw uploadError;

  const publicUrl = getPhotoPublicUrl(fileName);
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId);
  if (updateError) {
    console.warn('profiles.avatar_url update failed (avatar still uploaded):', updateError.message);
  }

  return publicUrl;
};

/** @deprecated use getTripPhotosList */
export const getPhotos = async (tripId: string) => getTripPhotosList(tripId);

export const updatePhotoCaption = async (photoId: string, caption: string, emoji?: string) => {
  const { data, error } = await supabase
    .from('photos')
    .update({ caption, emoji_mood: emoji })
    .eq('id', photoId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

/** Get the public URL for a file stored in the photos bucket. */
export const getPhotoPublicUrl = (storagePath: string): string => {
  const { data } = supabase.storage.from('photos').getPublicUrl(storagePath);
  return data.publicUrl;
};

/**
 * For each trip ID, returns the public URL of the earliest photo (by `taken_at`) from the `photos` table.
 * Used by the feed; requires RLS to allow SELECT on followed users' trip photos (see supabase SQL snippet).
 */
export const getFirstPhotoPublicUrlByTripIds = async (
  tripIds: string[]
): Promise<Map<string, string>> => {
  const map = new Map<string, string>();
  if (tripIds.length === 0) return map;

  const { data, error } = await supabase
    .from('photos')
    .select('trip_id, storage_path, taken_at')
    .in('trip_id', tripIds);

  if (error) throw error;

  const rows = [...(data || [])].sort((a, b) => {
    const ta = new Date((a as { taken_at?: string }).taken_at || 0).getTime();
    const tb = new Date((b as { taken_at?: string }).taken_at || 0).getTime();
    return ta - tb;
  });

  for (const row of rows as { trip_id: string; storage_path: string }[]) {
    if (!map.has(row.trip_id)) {
      map.set(row.trip_id, getPhotoPublicUrl(row.storage_path));
    }
  }
  return map;
};

/** @deprecated use getPhotoPublicUrl */
export const getPhotoUrl = async (storagePath: string) => getPhotoPublicUrl(storagePath);

// ── Privacy Settings API ──────────────────────────────────────

export const getPrivacySettings = async (userId: string) => {
  const { data, error } = await supabase
    .from('privacy_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;

  return data || {
    user_id: userId,
    gps_tracking_enabled: true,
    photo_geotagging_enabled: true,
    allow_anonymous_sharing: false,
    allow_research_data: false,
  };
};

export const updatePrivacySettings = async (userId: string, settings: Partial<{
  gps_tracking_enabled: boolean;
  photo_geotagging_enabled: boolean;
  allow_anonymous_sharing: boolean;
  allow_research_data: boolean;
}>) => {
  const { data, error } = await supabase
    .from('privacy_settings')
    .upsert({
      user_id: userId,
      ...settings,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};
