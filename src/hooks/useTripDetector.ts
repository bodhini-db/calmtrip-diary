import { useState, useEffect, useRef, useCallback } from 'react';
import { Checkpoint, CheckpointPhoto } from '@/lib/supabase';

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
  checkpoints: Checkpoint[];
}

const DISTANCE_THRESHOLD_M = 100;
const TIME_THRESHOLD_MS = 60000;
const ACCURACY_THRESHOLD_M = 50;

export const calculateDistance = (loc1: { latitude: number; longitude: number }, loc2: { latitude: number; longitude: number }): number => {
  const R = 6371000;
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

export const useTripDetector = () => {
  const [tripData, setTripData] = useState<TripData>({
    locations: [],
    startTime: Date.now(),
    distance: 0,
    isActive: false,
    checkpoints: [],
  });

  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<Location | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startTrip = useCallback(() => {
    lastLocationRef.current = null;
    setTripData(prev => ({
      ...prev,
      isActive: true,
      startTime: Date.now(),
      locations: [],
      distance: 0,
      checkpoints: [],
    }));
  }, []);

  const endTrip = useCallback((): TripData => {
    return tripData;
  }, [tripData]);

  // Inject a location externally (used by simulator)
  const addLocation = useCallback((loc: Location) => {
    const last = lastLocationRef.current;

    if (last) {
      const dist = calculateDistance(last, loc);
      setTripData(prev => ({
        ...prev,
        locations: [...prev.locations, loc],
        distance: prev.distance + dist,
        isActive: true,
      }));
    } else {
      setTripData(prev => ({
        ...prev,
        locations: [loc],
        isActive: true,
      }));
    }

    lastLocationRef.current = loc;
  }, []);

  const addCheckpoint = useCallback((cp: Checkpoint) => {
    setTripData(prev => ({
      ...prev,
      checkpoints: [...prev.checkpoints, cp],
    }));
  }, []);

  const addPhotoToCheckpoint = useCallback((checkpointId: string, photo: CheckpointPhoto) => {
    setTripData(prev => ({
      ...prev,
      checkpoints: prev.checkpoints.map(cp =>
        cp.id === checkpointId
          ? { ...cp, photos: [...cp.photos, photo] }
          : cp
      ),
    }));
  }, []);

  const updateCheckpointName = useCallback((checkpointId: string, name: string) => {
    setTripData(prev => ({
      ...prev,
      checkpoints: prev.checkpoints.map(cp =>
        cp.id === checkpointId
          ? { ...cp, name }
          : cp
      ),
    }));
  }, []);

  const handleLocationUpdate = (position: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = position.coords;
    const timestamp = position.timestamp;

    if (accuracy && accuracy > ACCURACY_THRESHOLD_M) {
      return;
    }

    const newLocation: Location = { latitude, longitude, timestamp };

    if (lastLocationRef.current) {
      const distance = calculateDistance(lastLocationRef.current, newLocation);

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      setTripData(prev => {
        let newDistance = prev.distance + distance;
        let newIsActive = prev.isActive;

        if (!prev.isActive && distance > DISTANCE_THRESHOLD_M) {
          newIsActive = true;
        }

        return {
          ...prev,
          locations: [...prev.locations, newLocation],
          distance: newDistance,
          isActive: newIsActive,
        };
      });

      if (tripData.isActive) {
        inactivityTimerRef.current = setTimeout(() => {
          setTripData(prev => ({ ...prev, isActive: false }));
        }, TIME_THRESHOLD_MS);
      }
    } else {
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
    addLocation,
    addCheckpoint,
    addPhotoToCheckpoint,
    updateCheckpointName,
  };
};
