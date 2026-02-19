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
  const { data, error } = await supabase.auth.updateUser({
    data: updates,
  });
  if (error) throw error;
  return data.user;
};

export const uploadAvatar = async (userId: string, file: File): Promise<string> => {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(path, file, { contentType: file.type, upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('photos').getPublicUrl(path);
  return data.publicUrl;
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

/**
 * Delete a trip and all its associated data:
 * - All photos from storage
 * - All photo records from database
 * - The trip record itself
 */
export const deleteTrip = async (tripId: string) => {
  // 1. Get all photos for this trip
  const photos = await getTripPhotosList(tripId);

  // 2. Delete all photo files from storage
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

  // 3. Delete all photo records from database
  if (photos.length > 0) {
    const { error: photosError } = await supabase
      .from('photos')
      .delete()
      .eq('trip_id', tripId);
    if (photosError) throw photosError;
  }

  // 4. Delete the trip record
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
