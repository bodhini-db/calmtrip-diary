import { useState, useRef, useCallback } from 'react';
import { Checkpoint } from '@/lib/supabase';
import { Location } from './useTripDetector';

// Popular Bangalore locations for preset picker
export interface PresetLocation {
  name: string;
  description: string;
  lat: number;
  lng: number;
}

export const BANGALORE_PRESETS: PresetLocation[] = [
  { name: "HSR Layout", description: "27th Main Road", lat: 12.9116, lng: 77.6389 },
  { name: "Toit Brewpub", description: "Koramangala 100 Feet Road", lat: 12.9364, lng: 77.6138 },
  { name: "Cubbon Park", description: "Historic park, MG Road", lat: 12.9716, lng: 77.5946 },
  { name: "Indiranagar", description: "100 Feet Road", lat: 12.9784, lng: 77.6408 },
  { name: "MG Road", description: "Central Bangalore", lat: 12.9756, lng: 77.6068 },
  { name: "Lalbagh Garden", description: "Botanical garden", lat: 12.9507, lng: 77.5848 },
  { name: "Brigade Road", description: "Shopping district", lat: 12.9716, lng: 77.6070 },
  { name: "Whitefield", description: "IT Hub", lat: 12.9698, lng: 77.7500 },
  { name: "JP Nagar", description: "South Bangalore", lat: 12.9063, lng: 77.5857 },
  { name: "Marathahalli", description: "ORR junction", lat: 12.9591, lng: 77.7010 },
  { name: "Electronic City", description: "IT Park", lat: 12.8440, lng: 77.6593 },
  { name: "Jayanagar", description: "4th Block", lat: 12.9308, lng: 77.5838 },
];

function interpolate(
  start: [number, number],
  end: [number, number],
  steps: number
): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / (steps + 1);
    points.push([
      start[0] + (end[0] - start[0]) * t,
      start[1] + (end[1] - start[1]) * t,
    ]);
  }
  return points;
}

function buildRouteFromCheckpoints(checkpoints: PresetLocation[]): {
  allPoints: [number, number][];
  checkpointIndices: number[];
} {
  if (checkpoints.length < 2) {
    return { allPoints: [], checkpointIndices: [] };
  }

  const STEPS_PER_SEGMENT = 3;
  const allPoints: [number, number][] = [];
  const checkpointIndices: number[] = [];

  // First checkpoint
  allPoints.push([checkpoints[0].lat, checkpoints[0].lng]);
  checkpointIndices.push(0);

  for (let i = 0; i < checkpoints.length - 1; i++) {
    const start: [number, number] = [checkpoints[i].lat, checkpoints[i].lng];
    const end: [number, number] = [checkpoints[i + 1].lat, checkpoints[i + 1].lng];

    // Add intermediate waypoints based on distance
    const dLat = end[0] - start[0];
    const dLng = end[1] - start[1];
    const roughDist = Math.sqrt(dLat * dLat + dLng * dLng);
    const numWaypoints = Math.max(3, Math.round(roughDist / 0.005)); // ~500m per waypoint

    for (let j = 1; j <= numWaypoints; j++) {
      const t = j / numWaypoints;
      // Add slight curve to make route look natural
      const jitter = Math.sin(t * Math.PI) * 0.001 * (i % 2 === 0 ? 1 : -1);
      const lat = start[0] + dLat * t + jitter;
      const lng = start[1] + dLng * t + jitter * 0.5;
      allPoints.push([lat, lng]);

      // Insert interpolated sub-points for smoother animation
      if (j < numWaypoints) {
        const nextT = (j + 1) / numWaypoints;
        const nextLat = start[0] + dLat * nextT;
        const nextLng = start[1] + dLng * nextT;
        const between = interpolate([lat, lng], [nextLat, nextLng], STEPS_PER_SEGMENT);
        allPoints.push(...between);
      }
    }

    // Mark checkpoint index
    checkpointIndices.push(allPoints.length - 1);
  }

  return { allPoints, checkpointIndices };
}

export interface SimulatorState {
  isSimulating: boolean;
  isPaused: boolean;
  pausedAtCheckpoint: boolean;
  currentPointIndex: number;
  speed: number;
  totalPoints: number;
  reachedCheckpoints: string[];
}

interface SimulatorOptions {
  onLocationUpdate: (lat: number, lng: number) => void;
  addLocation: (loc: Location) => void;
  addCheckpoint: (cp: Checkpoint) => void;
  onCheckpointReached: (checkpoint: Checkpoint) => void;
}

export const useTripSimulator = (options: SimulatorOptions) => {
  const [simState, setSimState] = useState<SimulatorState>({
    isSimulating: false,
    isPaused: false,
    pausedAtCheckpoint: false,
    currentPointIndex: 0,
    speed: 2,
    totalPoints: 0,
    reachedCheckpoints: [],
  });

  const [customCheckpoints, setCustomCheckpoints] = useState<PresetLocation[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = useRef(0);
  const speedRef = useRef(2);
  const reachedRef = useRef<Set<string>>(new Set());
  const optionsRef = useRef(options);
  const routeRef = useRef<{ allPoints: [number, number][]; checkpointIndices: number[] }>({ allPoints: [], checkpointIndices: [] });
  const checkpointsRef = useRef<PresetLocation[]>(customCheckpoints);
  optionsRef.current = options;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const idx = indexRef.current;
    const { allPoints, checkpointIndices } = routeRef.current;

    if (idx >= allPoints.length) {
      clearTimer();
      setSimState(prev => ({ ...prev, isSimulating: false, isPaused: false, pausedAtCheckpoint: false }));
      return;
    }

    const [lat, lng] = allPoints[idx];
    const loc: Location = { latitude: lat, longitude: lng, timestamp: Date.now() };

    optionsRef.current.addLocation(loc);
    optionsRef.current.onLocationUpdate(lat, lng);

    // Check if we reached a checkpoint
    const cpIdx = checkpointIndices.indexOf(idx);
    if (cpIdx >= 0) {
      const cpData = checkpointsRef.current[cpIdx];
      if (cpData && !reachedRef.current.has(cpData.name)) {
        reachedRef.current.add(cpData.name);
        const checkpoint: Checkpoint = {
          id: crypto.randomUUID(),
          name: cpData.name,
          description: cpData.description,
          lat,
          lng,
          timestamp: Date.now(),
          photos: [],
        };
        optionsRef.current.addCheckpoint(checkpoint);
        optionsRef.current.onCheckpointReached(checkpoint);

        // Pause at checkpoint (not the starting point)
        if (cpIdx > 0) {
          clearTimer();
          indexRef.current = idx + 1;
          setSimState(prev => ({
            ...prev,
            isPaused: true,
            pausedAtCheckpoint: true,
            currentPointIndex: idx + 1,
            reachedCheckpoints: [...prev.reachedCheckpoints, cpData.name],
          }));
          return;
        }

        setSimState(prev => ({
          ...prev,
          reachedCheckpoints: [...prev.reachedCheckpoints, cpData.name],
        }));
      }
    }

    indexRef.current = idx + 1;
    setSimState(prev => ({ ...prev, currentPointIndex: idx + 1 }));
  }, [clearTimer]);

  const startInterval = useCallback(() => {
    clearTimer();
    const ms = Math.max(50, 800 / speedRef.current);
    intervalRef.current = setInterval(tick, ms);
  }, [tick, clearTimer]);

  const startSimulation = useCallback(() => {
    // Build route from current checkpoints
    const route = buildRouteFromCheckpoints(checkpointsRef.current);
    routeRef.current = route;

    indexRef.current = 0;
    reachedRef.current = new Set();
    setSimState({
      isSimulating: true,
      isPaused: false,
      pausedAtCheckpoint: false,
      currentPointIndex: 0,
      speed: speedRef.current,
      totalPoints: route.allPoints.length,
      reachedCheckpoints: [],
    });
    startInterval();
  }, [startInterval]);

  const pauseSimulation = useCallback(() => {
    clearTimer();
    setSimState(prev => ({ ...prev, isPaused: true }));
  }, [clearTimer]);

  const resumeSimulation = useCallback(() => {
    setSimState(prev => ({ ...prev, isPaused: false, pausedAtCheckpoint: false }));
    startInterval();
  }, [startInterval]);

  const stopSimulation = useCallback(() => {
    clearTimer();
    setSimState(prev => ({
      ...prev,
      isSimulating: false,
      isPaused: false,
      pausedAtCheckpoint: false,
    }));
  }, [clearTimer]);

  const setSpeed = useCallback((speed: number) => {
    speedRef.current = speed;
    setSimState(prev => ({ ...prev, speed }));
    if (simState.isSimulating && !simState.isPaused) {
      startInterval();
    }
  }, [simState.isSimulating, simState.isPaused, startInterval]);

  const updateCheckpoints = useCallback((cps: PresetLocation[]) => {
    setCustomCheckpoints(cps);
    checkpointsRef.current = cps;
  }, []);

  const addCustomCheckpoint = useCallback((cp: PresetLocation) => {
    setCustomCheckpoints(prev => {
      const next = [...prev, cp];
      checkpointsRef.current = next;
      return next;
    });
  }, []);

  const removeCheckpoint = useCallback((index: number) => {
    setCustomCheckpoints(prev => {
      const next = prev.filter((_, i) => i !== index);
      checkpointsRef.current = next;
      return next;
    });
  }, []);

  return {
    simState,
    customCheckpoints,
    routePoints: routeRef.current.allPoints,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    stopSimulation,
    setSpeed,
    updateCheckpoints,
    addCustomCheckpoint,
    removeCheckpoint,
  };
};
