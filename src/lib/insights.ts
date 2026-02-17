import { Trip, Photo } from './supabase';

export interface DayOfWeekData {
  day: string;
  trips: number;
}

export interface TravelInsights {
  totalDistanceKm: number;
  tripCount: number;
  weeklyDistance: number;
  monthlyDistance: number;
  mostVisitedLocation: string | null;
  travelFrequency: string;
  totalPhotos: number;
  friendlyMessage: string;
  tripsPerDayOfWeek: DayOfWeekData[];
}

export const calculateInsights = (trips: Trip[], photos: Photo[]): TravelInsights => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const allTrips = trips || [];
  const allPhotos = photos || [];

  const totalDistance = allTrips.reduce((sum, trip) => sum + (trip.distance_km || 0), 0);
  const weeklyTrips = allTrips.filter(t => new Date(t.created_at) > sevenDaysAgo);
  const weeklyDistance = weeklyTrips.reduce((sum, trip) => sum + (trip.distance_km || 0), 0);
  const monthlyTrips = allTrips.filter(t => new Date(t.created_at) > thirtyDaysAgo);
  const monthlyDistance = monthlyTrips.reduce((sum, trip) => sum + (trip.distance_km || 0), 0);

  // Find most visited location
  const locationFrequency: Record<string, number> = {};
  allTrips.forEach(trip => {
    if (trip.destination) {
      locationFrequency[trip.destination] = (locationFrequency[trip.destination] || 0) + 1;
    }
  });

  const mostVisitedLocation = Object.keys(locationFrequency).length > 0
    ? Object.entries(locationFrequency).sort((a, b) => b[1] - a[1])[0][0]
    : null;

  // Calculate travel frequency
  const daysWithTrips = new Set(
    allTrips.map(t => new Date(t.created_at).toDateString())
  ).size;

  let travelFrequency = 'Relaxed Explorer';
  if (daysWithTrips >= 20) travelFrequency = 'Adventure Seeker';
  else if (daysWithTrips >= 10) travelFrequency = 'Active Traveler';
  else if (daysWithTrips >= 5) travelFrequency = 'Regular Wanderer';

  // Generate friendly message
  let friendlyMessage = 'Start your first journey to explore! 🌍';
  if (allTrips.length > 0) {
    if (totalDistance < 10) {
      friendlyMessage = `You've explored ${totalDistance.toFixed(1)}km gently. Every journey matters! 🚶`;
    } else if (totalDistance < 50) {
      friendlyMessage = `${totalDistance.toFixed(0)}km traveled! You're discovering the world at your pace. 🌏`;
    } else if (totalDistance < 200) {
      friendlyMessage = `${totalDistance.toFixed(0)}km of adventures! You're a true explorer! 🗺️`;
    } else {
      friendlyMessage = `${totalDistance.toFixed(0)}km traveled—you're an incredible journeyer! ✨`;
    }
  }

  // Trips per day of week
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayCounts = new Array(7).fill(0);
  allTrips.forEach(trip => {
    const day = new Date(trip.created_at).getDay();
    dayCounts[day]++;
  });
  const tripsPerDayOfWeek: DayOfWeekData[] = dayNames.map((day, i) => ({
    day,
    trips: dayCounts[i],
  }));

  return {
    totalDistanceKm: totalDistance,
    tripCount: allTrips.length,
    weeklyDistance,
    monthlyDistance,
    mostVisitedLocation,
    travelFrequency,
    totalPhotos: allPhotos.length,
    friendlyMessage,
    tripsPerDayOfWeek,
  };
};

export const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${(km * 1000).toFixed(0)}m`;
  }
  return `${km.toFixed(1)}km`;
};
