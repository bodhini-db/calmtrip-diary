import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not configured');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Auth helpers
export const getCurrentUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const signUp = async (email: string, password: string) => {
  return supabase.auth.signUp({
    email,
    password,
  });
};

export const signIn = async (email: string, password: string) => {
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
};

export const signOut = async () => {
  return supabase.auth.signOut();
};

// Types for database operations
export interface Trip {
  id: string;
  user_id: string;
  origin: string;
  destination: string;
  start_time: string;
  end_time: string;
  distance_km: number;
  duration_minutes: number;
  route_coordinates: Array<[number, number]>;
  purpose?: string;
  created_at: string;
}

export interface Photo {
  id: string;
  trip_id: string;
  user_id: string;
  storage_path: string;
  latitude: number;
  longitude: number;
  caption?: string;
  emoji_mood?: string;
  taken_at: string;
  created_at: string;
}

export interface PrivacySettings {
  user_id: string;
  allow_anonymous_sharing: boolean;
  allow_research_data: boolean;
  gps_tracking_enabled: boolean;
  updated_at: string;
}
