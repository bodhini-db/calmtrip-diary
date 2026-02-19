import { supabase, Trip, Photo, TripCheckpointMeta } from './supabase';

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
