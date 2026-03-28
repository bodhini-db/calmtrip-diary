import { createClient, User } from '@supabase/supabase-js';

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

const sanitizeUsername = (email: string) => {
  return email
    .split('@')[0]
    .replace(/[^a-zA-Z0-9_]/g, '')
    .slice(0, 20) || 'traveler';
};

export const ensureUserProfile = async (user: User | null) => {
  if (!user) return;

  const username = user.email ? sanitizeUsername(user.email) : user.id.slice(0, 12);
  const { data: existing, error: existingError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (existingError && !existingError.message?.includes('does not exist')) {
    console.warn('Could not check profile existence:', existingError.message);
    return;
  }

  if (!existing) {
    const { error } = await supabase.from('profiles').insert([
      {
        id: user.id,
        username,
        full_name: user.user_metadata?.full_name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        bio: null,
      },
    ]);
    if (error) {
      console.warn('Could not create profile record:', error.message);
    }
  }
};

export const signUp = async (email: string, password: string) => {
  const result = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/confirm`,
    },
  });

  const user = result.data?.user ?? null;
  if (user) {
    await ensureUserProfile(user);
  }

  return result;
};

export const signIn = async (email: string, password: string) => {
  const result = await supabase.auth.signInWithPassword({ email, password });
  const user = result.data?.user ?? null;
  if (user) {
    await ensureUserProfile(user);
  }
  return result;
};

export const signOut = async () => {
  return supabase.auth.signOut();
};

// ── Database types ────────────────────────────────────────────

export interface TripCheckpointMeta {
  id: string;
  name: string;
  lat: number;
  lng: number;
  timestamp: number;
  description?: string;
}

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
  /** Checkpoint metadata (no photo blobs). Photos live in the photos table. */
  checkpoints: TripCheckpointMeta[];
  purpose?: string;
  created_at: string;
}

export interface Photo {
  id: string;
  trip_id: string;
  user_id: string;
  /** Matches id field inside trips.checkpoints JSONB array */
  checkpoint_id?: string;
  storage_path: string;
  latitude?: number;
  longitude?: number;
  caption?: string;
  emoji_mood?: string;
  taken_at: string;
  created_at: string;
}

export interface CheckpointPhoto {
  id: string;
  objectUrl: string;
  caption?: string;
  timestamp: number;
}

export interface Checkpoint {
  id: string;
  name: string;
  description?: string;
  lat: number;
  lng: number;
  timestamp: number;
  photos: CheckpointPhoto[];
}

export interface PrivacySettings {
  user_id: string;
  gps_tracking_enabled: boolean;
  photo_geotagging_enabled: boolean;
  allow_anonymous_sharing: boolean;
  allow_research_data: boolean;
  updated_at: string;
}
