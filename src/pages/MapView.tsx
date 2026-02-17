import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTripDetector } from "@/hooks/useTripDetector";
import { useTripSimulator, BANGALORE_PRESETS } from "@/hooks/useTripSimulator";
import { Button } from "@/components/ui/button";
import { CheckpointDialog } from "@/components/CheckpointDialog";
import { ChevronLeft, Crosshair, MapPin, Play, Pause, Square, Zap, Plus, X, ChevronDown } from "lucide-react";
import { Checkpoint, CheckpointPhoto } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { saveLocalTrip } from "@/lib/localTrips";
import L from "leaflet";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function MapController({ currentLocation, shouldCenter }: { currentLocation: [number, number] | null; shouldCenter: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (shouldCenter && currentLocation && map) {
      map.setView(currentLocation, 15);
    }
  }, [currentLocation, shouldCenter, map]);
  return null;
}

const currentLocationIcon = L.divIcon({
  html: `<div style="width:20px;height:20px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(59,130,246,0.5)"></div>`,
  className: "current-location-marker",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const createCheckpointIcon = (name: string, reached: boolean) => {
  return L.divIcon({
    html: `
      <div style="
        display:flex; align-items:center; gap:4px;
        background:${reached ? '#22c55e' : '#94a3b8'};
        color:white; padding:4px 10px; border-radius:16px;
        font-size:11px; font-weight:600; white-space:nowrap;
        box-shadow:0 2px 8px rgba(0,0,0,0.2);
        border:2px solid white;
      ">
        <span style="font-size:12px">${reached ? '\u2713' : '\u25CF'}</span>
        ${name}
      </div>
    `,
    className: "checkpoint-marker",
    iconSize: [140, 28],
    iconAnchor: [70, 14],
  });
};

const createPhotoIcon = (url?: string) => {
  const html = url
    ? `<div style="width:48px;height:48px;border-radius:10px;overflow:hidden;border:3px solid white;box-shadow:0 4px 8px rgba(0,0,0,0.15);background-image:url('${url}');background-size:cover;background-position:center"></div>`
    : `<div style="width:48px;height:48px;border-radius:10px;background:#e2e8f0;border:3px solid white"></div>`;
  return L.divIcon({ html, className: "photo-marker", iconSize: [48, 48], iconAnchor: [24, 24] });
};

const MapView = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const {
    tripData, startTracking, stopTracking, startTrip, endTrip,
    addLocation, addCheckpoint, addPhotoToCheckpoint, updateCheckpointName,
  } = useTripDetector();

  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [shouldCenter, setShouldCenter] = useState(true);
  const [showSimPanel, setShowSimPanel] = useState(false);
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [checkpointDialogOpen, setCheckpointDialogOpen] = useState(false);
  const [activeCheckpointId, setActiveCheckpointId] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const onCheckpointReached = useCallback((checkpoint: Checkpoint) => {
    toast({
      title: `Reached: ${checkpoint.name}!`,
      description: "Journal time! Add photos to remember this stop.",
    });
    // Auto-open checkpoint dialog
    setActiveCheckpointId(checkpoint.id);
    setCheckpointDialogOpen(true);
  }, [toast]);

  const {
    simState, customCheckpoints, routePoints,
    startSimulation, pauseSimulation, resumeSimulation, stopSimulation, setSpeed,
    addCustomCheckpoint, removeCheckpoint,
  } = useTripSimulator({
    onLocationUpdate: (lat, lng) => {
      setCurrentLocation([lat, lng]);
      setShouldCenter(true);
      setTimeout(() => setShouldCenter(false), 50);
    },
    addLocation,
    addCheckpoint,
    onCheckpointReached,
  });

  // Only close dialog — do NOT auto-resume. User must click "Resume Trip".
  const handleCheckpointDialogChange = (open: boolean) => {
    setCheckpointDialogOpen(open);
  };

  const handleResumeFromCheckpoint = () => {
    setCheckpointDialogOpen(false);
    resumeSimulation();
  };

  useEffect(() => {
    if (!user && !loading) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  // Get current location on mount (only when not simulating)
  useEffect(() => {
    if (simState.isSimulating) return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => setCurrentLocation([pos.coords.latitude, pos.coords.longitude]),
      (err) => {
        console.error("Location error:", err);
        setLocationError(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (!simState.isSimulating) {
          setCurrentLocation([pos.coords.latitude, pos.coords.longitude]);
        }
      },
      (err) => console.error("Watch error:", err),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [simState.isSimulating]);

  const handleToggleTracking = () => {
    if (isTracking) {
      stopTracking();
      const finalData = endTrip();
      saveTripLocally(finalData);
      setIsTracking(false);
    } else {
      startTracking();
      startTrip();
      setIsTracking(true);
    }
  };

  const saveTripLocally = (data: typeof tripData) => {
    if (data.locations.length === 0) return;
    const origin = data.checkpoints[0]?.name || "Start";
    const destination = data.checkpoints[data.checkpoints.length - 1]?.name || "End";
    saveLocalTrip({
      user_id: user?.id || "dev-mock-user-001",
      origin,
      destination,
      start_time: new Date(data.startTime).toISOString(),
      end_time: new Date().toISOString(),
      distance_km: data.distance / 1000,
      duration_minutes: Math.round((Date.now() - data.startTime) / 60000),
      route_coordinates: data.locations.map(l => [l.latitude, l.longitude] as [number, number]),
      checkpoints: data.checkpoints,
    });
    toast({ title: "Trip saved!", description: `${origin} to ${destination} - check your Journal.` });
  };

  const handleStartSimulation = () => {
    if (customCheckpoints.length < 2) {
      toast({ title: "Need at least 2 checkpoints", description: "Add more stops to simulate a trip." });
      return;
    }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    startTrip();
    setIsTracking(true);
    startSimulation();
  };

  const handleStopSimulation = () => {
    stopSimulation();
    const finalData = endTrip();
    saveTripLocally(finalData);
    setIsTracking(false);
  };

  const handleAddCheckpoint = () => {
    if (!currentLocation) return;
    const cp: Checkpoint = {
      id: crypto.randomUUID(),
      name: "New Checkpoint",
      lat: currentLocation[0],
      lng: currentLocation[1],
      timestamp: Date.now(),
      photos: [],
    };
    addCheckpoint(cp);
    setActiveCheckpointId(cp.id);
    setCheckpointDialogOpen(true);
  };

  const handleAddPhotoToCheckpoint = (photo: CheckpointPhoto) => {
    if (!activeCheckpointId) return;
    addPhotoToCheckpoint(activeCheckpointId, photo);
  };


  const handleCheckpointNameUpdate = (name: string) => {
    if (activeCheckpointId) {
      updateCheckpointName(activeCheckpointId, name);
    }
  };

  const polyPositions: [number, number][] = tripData.locations.map((l) => [l.latitude, l.longitude]);
  const totalPhotos = tripData.checkpoints.reduce((sum, cp) => sum + cp.photos.length, 0);

  if (loading || (!currentLocation && !locationError && polyPositions.length === 0)) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🗺️</div>
          <p className="text-muted-foreground">Getting your location...</p>
        </div>
      </div>
    );
  }

  const center: [number, number] = currentLocation || (polyPositions.length > 0 ? polyPositions[Math.floor(polyPositions.length / 2)] : [12.9716, 77.5946]);
  const handleRecenter = () => {
    setShouldCenter(true);
    setTimeout(() => setShouldCenter(false), 100);
  };

  const activeCheckpoint = tripData.checkpoints.find(cp => cp.id === activeCheckpointId) || null;

  // Upcoming sim checkpoints (not yet reached) — show grayed markers
  const upcomingCheckpoints = simState.isSimulating
    ? customCheckpoints.filter(sc => !simState.reachedCheckpoints.includes(sc.name))
    : [];

  return (
    <div className="relative w-full h-screen flex flex-col">
      <MapContainer center={center} zoom={15} className="flex-1 h-full w-full">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        <MapController currentLocation={currentLocation} shouldCenter={shouldCenter} />

        {/* Route polyline */}
        {polyPositions.length > 1 && (
          <Polyline positions={polyPositions} pathOptions={{ color: "#22c55e", weight: 4, opacity: 0.9 }} />
        )}

        {/* Current location */}
        {currentLocation && (
          <>
            <Circle center={currentLocation} radius={30} pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.15, weight: 1 }} />
            <Marker position={currentLocation} icon={currentLocationIcon}>
              <Popup>Your current location</Popup>
            </Marker>
          </>
        )}

        {/* Reached checkpoint markers */}
        {tripData.checkpoints.map((cp) => (
          <Marker
            key={cp.id}
            position={[cp.lat, cp.lng]}
            icon={createCheckpointIcon(cp.name, true)}
            eventHandlers={{
              click: () => {
                setActiveCheckpointId(cp.id);
                setCheckpointDialogOpen(true);
              },
            }}
          >
            <Popup>
              <div className="text-sm font-semibold">{cp.name}</div>
              {cp.description && <div className="text-xs text-gray-500">{cp.description}</div>}
              <div className="text-xs">{cp.photos.length} photos</div>
            </Popup>
          </Marker>
        ))}

        {/* Upcoming checkpoint markers (grayed) */}
        {upcomingCheckpoints.map((sc) => (
          <Marker
            key={sc.name}
            position={[sc.lat, sc.lng]}
            icon={createCheckpointIcon(sc.name, false)}
          >
            <Popup>
              <div className="text-sm font-semibold">{sc.name}</div>
              <div className="text-xs text-gray-500">{sc.description}</div>
              <div className="text-xs italic">Upcoming</div>
            </Popup>
          </Marker>
        ))}

        {/* Checkpoint photo markers */}
        {tripData.checkpoints.flatMap((cp) =>
          cp.photos.map((photo, i) => (
            <Marker
              key={photo.id}
              position={[cp.lat + i * 0.0001, cp.lng + i * 0.0001]}
              icon={createPhotoIcon(photo.objectUrl)}
            >
              <Popup>
                <div style={{ width: 160, height: 112, overflow: "hidden", borderRadius: 8 }}>
                  <img src={photo.objectUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={photo.caption || "photo"} />
                </div>
              </Popup>
            </Marker>
          ))
        )}
      </MapContainer>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 safe-top px-4 py-3 flex flex-col gap-2 z-[1000]">
        <div className="flex items-center justify-between">
          <Button variant="icon" size="icon" onClick={() => navigate(-1)} className="bg-white/80 backdrop-blur">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-foreground">Your Journey</h1>
          <Button variant="icon" size="icon" onClick={handleRecenter} className="bg-white/80 backdrop-blur">
            <Crosshair className="w-5 h-5" />
          </Button>
        </div>
        {locationError && !simState.isSimulating && (
          <div className="bg-amber-100 text-amber-800 text-xs px-3 py-2 rounded-lg text-center">
            Location access denied. Enable location in browser & Windows Settings &gt; Privacy &gt; Location.
          </div>
        )}
      </div>

      {/* Checkpoint reached banner */}
      {simState.pausedAtCheckpoint && (
        <div className="absolute top-14 left-4 right-4 z-[1000] bg-green-500 text-white rounded-xl p-4 shadow-lg animate-in slide-in-from-top">
          <p className="font-bold text-sm">Checkpoint reached!</p>
          <p className="text-xs opacity-90">Add photos to your journal, then close the dialog to continue.</p>
        </div>
      )}

      {/* Simulator Panel */}
      <div className="absolute top-14 right-4 z-[1000] max-h-[70vh] overflow-y-auto">
        <Button
          variant="outline"
          size="sm"
          className="bg-amber-50 border-amber-300 text-amber-800 text-xs shadow-md"
          onClick={() => setShowSimPanel(!showSimPanel)}
        >
          <Zap className="w-3 h-3 mr-1" />
          {showSimPanel ? "Hide" : "Simulate"}
        </Button>

        {showSimPanel && (
          <div className="mt-2 bg-white/95 backdrop-blur rounded-xl p-3 shadow-lg w-64 border">
            <p className="text-xs font-bold text-amber-800 mb-2">Trip Simulator</p>

            {/* Checkpoint list */}
            {!simState.isSimulating && (
              <div className="mb-3">
                <p className="text-[10px] text-muted-foreground mb-1 font-medium uppercase tracking-wide">Stops</p>
                <div className="space-y-1 mb-2">
                  {customCheckpoints.map((cp, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2 py-1.5">
                      <span className="text-[10px] font-bold text-green-600 w-4">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{cp.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{cp.description}</p>
                      </div>
                      {customCheckpoints.length > 2 && (
                        <button
                          onClick={() => removeCheckpoint(i)}
                          className="text-gray-400 hover:text-red-500 p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add checkpoint */}
                <div className="relative">
                  <button
                    onClick={() => setShowPresetPicker(!showPresetPicker)}
                    className="w-full flex items-center justify-center gap-1 text-xs text-green-600 border border-dashed border-green-300 rounded-lg py-1.5 hover:bg-green-50 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add Stop
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {showPresetPicker && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto z-50">
                      {BANGALORE_PRESETS
                        .filter(p => !customCheckpoints.some(c => c.name === p.name))
                        .map((preset) => (
                          <button
                            key={preset.name}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-green-50 border-b last:border-0 transition-colors"
                            onClick={() => {
                              addCustomCheckpoint(preset);
                              setShowPresetPicker(false);
                            }}
                          >
                            <span className="font-medium">{preset.name}</span>
                            <span className="text-muted-foreground ml-1">- {preset.description}</span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Speed selector */}
            <div className="flex gap-1 mb-3">
              {[1, 2, 5, 10].map((s) => (
                <button
                  key={s}
                  className={`flex-1 text-xs py-1 rounded-md font-medium transition-colors ${
                    simState.speed === s
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  onClick={() => setSpeed(s)}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Progress bar */}
            {simState.isSimulating && (
              <div className="mb-3">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-200"
                    style={{ width: `${simState.totalPoints > 0 ? (simState.currentPointIndex / simState.totalPoints) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <p className="text-[10px] text-muted-foreground">
                    {simState.currentPointIndex}/{simState.totalPoints}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {simState.reachedCheckpoints.length}/{customCheckpoints.length} stops
                  </p>
                </div>
                {simState.pausedAtCheckpoint && (
                  <p className="text-[10px] text-green-600 font-medium mt-1 text-center">
                    Paused at checkpoint - add photos!
                  </p>
                )}
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-1.5">
              {!simState.isSimulating ? (
                <Button
                  variant="calm"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={handleStartSimulation}
                >
                  <Play className="w-3 h-3 mr-1" />
                  Start
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={simState.isPaused ? resumeSimulation : pauseSimulation}
                  >
                    {simState.isPaused ? (
                      <><Play className="w-3 h-3 mr-1" />Resume</>
                    ) : (
                      <><Pause className="w-3 h-3 mr-1" />Pause</>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={handleStopSimulation}
                  >
                    <Square className="w-3 h-3 mr-1" />
                    End
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-6 space-y-3 z-[1000]">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/90 backdrop-blur rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Distance</p>
            <p className="font-bold text-foreground">{(tripData.distance / 1000).toFixed(2)}km</p>
          </div>
          <div className="bg-white/90 backdrop-blur rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="font-bold text-foreground">{tripData.isActive ? Math.round((Date.now() - tripData.startTime) / 60000) : 0}m</p>
          </div>
          <div className="bg-white/90 backdrop-blur rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Photos</p>
            <p className="font-bold text-foreground">{totalPhotos}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="lg" className="flex-1" onClick={handleAddCheckpoint}>
            <MapPin className="w-4 h-4 mr-1" />
            Checkpoint
          </Button>
          {!simState.isSimulating && (
            <Button
              variant={isTracking ? "destructive" : "calm"}
              size="lg"
              className="flex-1"
              onClick={handleToggleTracking}
            >
              {isTracking ? "End Trip" : "Start Trip"}
            </Button>
          )}
        </div>
      </div>

      {/* Checkpoint Dialog */}
      <CheckpointDialog
        open={checkpointDialogOpen}
        onOpenChange={handleCheckpointDialogChange}
        checkpoint={activeCheckpoint}
        isSimPaused={simState.pausedAtCheckpoint}
        onUpdateName={handleCheckpointNameUpdate}
        onAddPhoto={handleAddPhotoToCheckpoint}
        onResume={handleResumeFromCheckpoint}
      />
    </div>
  );
};

export default MapView;
