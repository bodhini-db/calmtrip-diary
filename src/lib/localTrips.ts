import { Checkpoint } from './supabase';

export interface LocalTrip {
  id: string;
  user_id: string;
  origin: string;
  destination: string;
  start_time: string;
  end_time: string;
  distance_km: number;
  duration_minutes: number;
  route_coordinates: Array<[number, number]>;
  checkpoints: Checkpoint[];
  created_at: string;
}

const STORAGE_KEY = 'calmtrip_local_trips';

export function getLocalTrips(userId: string): LocalTrip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const all: LocalTrip[] = JSON.parse(raw);
    return all.filter(t => t.user_id === userId).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch {
    return [];
  }
}

export function saveLocalTrip(trip: Omit<LocalTrip, 'id' | 'created_at'>): LocalTrip {
  const newTrip: LocalTrip = {
    ...trip,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: LocalTrip[] = raw ? JSON.parse(raw) : [];
    all.push(newTrip);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.error('Failed to save trip locally:', err);
  }

  return newTrip;
}

export function getLocalTripPhotos(tripId: string): Checkpoint['photos'] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const all: LocalTrip[] = JSON.parse(raw);
    const trip = all.find(t => t.id === tripId);
    if (!trip) return [];
    return trip.checkpoints.flatMap(cp => cp.photos);
  } catch {
    return [];
  }
}
