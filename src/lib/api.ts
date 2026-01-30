import { supabase, Trip, Photo } from './supabase';

// Trip API
export const createTrip = async (trip: Omit<Trip, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('trips')
    .insert([trip])
    .select()
    .single();
  if (error) throw error;
  return data;
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

// Photo API
export const uploadPhoto = async (
  userId: string,
  tripId: string,
  file: File,
  latitude: number,
  longitude: number
) => {
  const fileName = `${userId}/${tripId}/${Date.now()}-${file.name}`;
  
  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(fileName, file);
  
  if (uploadError) throw uploadError;

  const { data: photoData, error: photoError } = await supabase
    .from('photos')
    .insert([{
      user_id: userId,
      trip_id: tripId,
      storage_path: fileName,
      latitude,
      longitude,
      taken_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (photoError) throw photoError;
  return photoData;
};

export const getPhotos = async (tripId: string) => {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('trip_id', tripId)
    .order('taken_at', { ascending: false });
  if (error) throw error;
  return data as Photo[];
};

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

export const getPhotoUrl = async (storagePath: string) => {
  const { data } = supabase.storage
    .from('photos')
    .getPublicUrl(storagePath);
  return data.publicUrl;
};

// Privacy Settings API
export const getPrivacySettings = async (userId: string) => {
  const { data, error } = await supabase
    .from('privacy_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  
  return data || {
    user_id: userId,
    allow_anonymous_sharing: false,
    allow_research_data: false,
    gps_tracking_enabled: true,
  };
};

export const updatePrivacySettings = async (userId: string, settings: any) => {
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
