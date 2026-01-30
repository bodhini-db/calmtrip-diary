import { useState, useEffect, useRef } from 'react';

export interface Location {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface TripData {
  locations: Location[];
  startTime: number;
  distance: number;
  isActive: boolean;
}

const DISTANCE_THRESHOLD_M = 100; // Trip starts/ends when movement > 100m
const TIME_THRESHOLD_MS = 60000; // 1 minute of inactivity ends trip
const ACCURACY_THRESHOLD_M = 50; // Only track points with good accuracy

export const useTripDetector = () => {
  const [tripData, setTripData] = useState<TripData>({
    locations: [],
    startTime: Date.now(),
    distance: 0,
    isActive: false,
  });

  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<Location | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const calculateDistance = (loc1: Location, loc2: Location): number => {
    // Haversine formula for great-circle distance
    const R = 6371000; // Earth's radius in meters
    const dLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
    const dLon = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((loc1.latitude * Math.PI) / 180) *
        Math.cos((loc2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const startTrip = () => {
    setTripData(prev => ({
      ...prev,
      isActive: true,
      startTime: Date.now(),
      locations: [],
      distance: 0,
    }));
  };

  const endTrip = (): TripData => {
    return tripData;
  };

  const handleLocationUpdate = (position: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = position.coords;
    const timestamp = position.timestamp;

    // Skip low-accuracy readings
    if (accuracy && accuracy > ACCURACY_THRESHOLD_M) {
      return;
    }

    const newLocation: Location = { latitude, longitude, timestamp };

    if (lastLocationRef.current) {
      const distance = calculateDistance(lastLocationRef.current, newLocation);

      // Clear inactivity timer when movement detected
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      setTripData(prev => {
        let newDistance = prev.distance + distance;
        let newIsActive = prev.isActive;

        // Start trip if distance exceeds threshold
        if (!prev.isActive && distance > DISTANCE_THRESHOLD_M) {
          newIsActive = true;
        }

        const newData = {
          ...prev,
          locations: [...prev.locations, newLocation],
          distance: newDistance,
          isActive: newIsActive,
        };

        return newData;
      });

      // Set inactivity timer
      if (tripData.isActive) {
        inactivityTimerRef.current = setTimeout(() => {
          setTripData(prev => ({ ...prev, isActive: false }));
        }, TIME_THRESHOLD_MS);
      }
    } else {
      // First location
      setTripData(prev => ({
        ...prev,
        locations: [newLocation],
      }));
    }

    lastLocationRef.current = newLocation;
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleLocationUpdate,
      error => console.error('Geolocation error:', error),
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  return {
    tripData,
    startTracking,
    stopTracking,
    startTrip,
    endTrip,
  };
};
