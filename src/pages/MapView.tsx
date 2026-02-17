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
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
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
  html: `
    <div style="position:relative;width:24px;height:24px">
      <div style="position:absolute;inset:-8px;background:rgba(59,130,246,0.15);border-radius:50%;animation:pulse-ring 2s ease-out infinite"></div>
      <div style="width:24px;height:24px;background:linear-gradient(135deg,#3b82f6,#2563eb);border:3px solid white;border-radius:50%;box-shadow:0 2px 12px rgba(59,130,246,0.4)"></div>
    </div>
  `,
  className: "current-location-marker",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const createCheckpointIcon = (name: string, reached: boolean) => {
  const bg = reached
    ? 'linear-gradient(135deg,#22c55e,#16a34a)'
    : 'linear-gradient(135deg,#94a3b8,#64748b)';
  return L.divIcon({
    html: `
      <div style="
        display:flex; align-items:center; gap:5px;
        background:${bg};
        color:white; padding:5px 12px; border-radius:20px;
        font-size:11px; font-weight:600; white-space:nowrap;
        box-shadow:0 2px 12px rgba(0,0,0,0.15);
        border:2px solid white;
        letter-spacing:0.3px;
      ">
        <span style="font-size:10px">${reached ? '\u2713' : '\u25CB'}</span>
        ${name}
      </div>
    `,
    className: "checkpoint-marker",
    iconSize: [140, 30],
    iconAnchor: [70, 15],
  });
};

const createPhotoIcon = (url?: string) => {
  const html = url
    ? `<div style="width:44px;height:44px;border-radius:12px;overflow:hidden;border:2.5px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.12);background-image:url('${url}');background-size:cover;background-position:center;transition:transform 0.2s"></div>`
    : `<div style="width:44px;height:44px;border-radius:12px;background:#f1f5f9;border:2.5px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.08)"></div>`;
  return L.divIcon({ html, className: "photo-marker", iconSize: [44, 44], iconAnchor: [22, 22] });
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
      <MapContainer center={center} zoom={15} className="flex-1 h-full w-full" zoomControl={false} attributionControl={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />
        <MapController currentLocation={currentLocation} shouldCenter={shouldCenter} />

        {/* Route polyline — shadow + main line for depth */}
        {polyPositions.length > 1 && (
          <>
            <Polyline positions={polyPositions} pathOptions={{ color: "#16a34a", weight: 7, opacity: 0.2, lineCap: "round", lineJoin: "round" }} />
            <Polyline positions={polyPositions} pathOptions={{ color: "#22c55e", weight: 4, opacity: 0.95, lineCap: "round", lineJoin: "round" }} />
          </>
        )}

        {/* Current location */}
        {currentLocation && (
          <Marker position={currentLocation} icon={currentLocationIcon} />
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
          <Button variant="icon" size="icon" onClick={() => navigate(-1)} className="bg-white/90 backdrop-blur-xl shadow-sm rounded-xl border border-white/50">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="bg-white/90 backdrop-blur-xl px-4 py-1.5 rounded-full shadow-sm border border-white/50">
            <h1 className="font-bold text-foreground text-sm">Your Journey</h1>
          </div>
          <Button variant="icon" size="icon" onClick={handleRecenter} className="bg-white/90 backdrop-blur-xl shadow-sm rounded-xl border border-white/50">
            <Crosshair className="w-5 h-5" />
          </Button>
        </div>
        {locationError && !simState.isSimulating && (
          <div className="bg-amber-50/90 backdrop-blur-xl text-amber-800 text-xs px-3 py-2 rounded-xl text-center border border-amber-200/50 shadow-sm">
            Location access denied. Enable location in browser & Windows Settings &gt; Privacy &gt; Location.
          </div>
        )}
      </div>

      {/* Checkpoint reached banner */}
      {simState.pausedAtCheckpoint && (
        <div className="absolute top-16 left-4 right-4 z-[1000] bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl p-4 shadow-lg animate-in slide-in-from-top border border-green-400/30">
          <p className="font-bold text-sm">Checkpoint reached!</p>
          <p className="text-xs opacity-90 mt-0.5">Add photos and a caption, then tap Resume Trip.</p>
        </div>
      )}

      {/* Simulator Panel */}
      <div className="absolute top-14 right-4 z-[1000] max-h-[70vh] overflow-y-auto">
        <Button
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-xl border-amber-200 text-amber-700 text-xs shadow-sm rounded-xl"
          onClick={() => setShowSimPanel(!showSimPanel)}
        >
          <Zap className="w-3 h-3 mr-1" />
          {showSimPanel ? "Hide" : "Simulate"}
        </Button>

        {showSimPanel && (
          <div className="mt-2 bg-white/95 backdrop-blur-xl rounded-2xl p-3 shadow-lg w-64 border border-white/50">
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
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-3 z-[1000]" style={{ background: "linear-gradient(to top, rgba(255,255,255,0.95) 60%, transparent)" }}>
        {/* Stats bar */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-3 mb-3 shadow-sm border border-white/50">
          <div className="grid grid-cols-3 divide-x divide-gray-200">
            <div className="text-center px-2">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Distance</p>
              <p className="font-bold text-foreground text-lg leading-tight">{(tripData.distance / 1000).toFixed(1)}<span className="text-xs font-medium text-muted-foreground ml-0.5">km</span></p>
            </div>
            <div className="text-center px-2">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Duration</p>
              <p className="font-bold text-foreground text-lg leading-tight">{tripData.isActive ? Math.round((Date.now() - tripData.startTime) / 60000) : 0}<span className="text-xs font-medium text-muted-foreground ml-0.5">min</span></p>
            </div>
            <div className="text-center px-2">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Photos</p>
              <p className="font-bold text-foreground text-lg leading-tight">{totalPhotos}</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2.5">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 h-12 rounded-xl bg-white/90 backdrop-blur-xl border-gray-200 shadow-sm font-semibold"
            onClick={handleAddCheckpoint}
          >
            <MapPin className="w-4 h-4 mr-1.5 text-green-600" />
            Checkpoint
          </Button>
          {!simState.isSimulating && (
            <Button
              variant={isTracking ? "destructive" : "calm"}
              size="lg"
              className="flex-1 h-12 rounded-xl shadow-sm font-semibold"
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
