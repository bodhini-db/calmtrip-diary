import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTripDetector } from "@/hooks/useTripDetector";
import { useTripSimulator, BANGALORE_PRESETS } from "@/hooks/useTripSimulator";
import { Button } from "@/components/ui/button";
import { CheckpointDialog } from "@/components/CheckpointDialog";
import { ChevronLeft, Crosshair, MapPin, Play, Pause, Square, Zap, Plus, X, ChevronDown, Navigation } from "lucide-react";
import { Checkpoint, CheckpointPhoto } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { saveLocalTrip } from "@/lib/localTrips";
import { createTrip, uploadTripPhoto } from "@/lib/api";
import { AiNearbyPlaces } from "@/components/AiNearbyPlaces";
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
    ? `<div style="width:44px;height:44px;border-radius:12px;overflow:hidden;border:2.5px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.12);background-image:url('${url}');background-size:cover;background-position:center"></div>`
    : `<div style="width:44px;height:44px;border-radius:12px;background:#f1f5f9;border:2.5px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.08)"></div>`;
  return L.divIcon({ html, className: "photo-marker", iconSize: [44, 44], iconAnchor: [22, 22] });
};

const MapView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const {
    tripData, startTrip, endTrip,
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
  const isTrackingRef = useRef(false);

  /**
   * Maps photo ID → original File so we can upload to Supabase when the trip ends.
   * Cleared after each trip save.
   */
  const photoFilesRef = useRef<Map<string, File>>(new Map());

  // Keep ref in sync so the GPS callback can read it
  isTrackingRef.current = isTracking;

  const onCheckpointReached = useCallback((checkpoint: Checkpoint) => {
    toast({
      title: `Reached: ${checkpoint.name}!`,
      description: "Journal time! Add photos to remember this stop.",
    });
    setActiveCheckpointId(checkpoint.id);
    setCheckpointDialogOpen(true);
  }, [toast]);

  const {
    simState, customCheckpoints, routePoints,
    startSimulation, pauseSimulation, resumeSimulation, stopSimulation, setSpeed,
    addCustomCheckpoint, removeCheckpoint, updateCheckpoints,
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

  // Load AI-generated plan from AiTripPlanner (passed via router state)
  useEffect(() => {
    const aiPlan = (location.state as any)?.aiPlan;
    if (!aiPlan?.checkpoints?.length) return;
    updateCheckpoints(aiPlan.checkpoints);
    setShowSimPanel(true);
    // Clear state so refreshing doesn't re-load
    window.history.replaceState({}, "");
  }, []);

  // Single GPS watcher
  useEffect(() => {
    if (simState.isSimulating) return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentLocation([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => {
        console.error("Location error:", err);
        setLocationError(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (simState.isSimulating) return;
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCurrentLocation(loc);

        if (isTrackingRef.current) {
          addLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            timestamp: pos.timestamp,
          });
        }
      },
      (err) => console.error("Watch error:", err),
      { enableHighAccuracy: true, maximumAge: 3000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [simState.isSimulating, addLocation]);

  // ── Trip save: local first, then Supabase ──────────────────

  const saveTripData = async (data: typeof tripData) => {
    if (data.locations.length === 0) return;

    const origin = data.checkpoints[0]?.name || "Start";
    const destination = data.checkpoints[data.checkpoints.length - 1]?.name || origin;
    const routeCoords: Array<[number, number]> = data.locations.map(l => [l.latitude, l.longitude]);
    const now = new Date().toISOString();
    const durationMinutes = Math.round((Date.now() - data.startTime) / 60000);
    const distanceKm = data.distance / 1000;

    const checkpointsMeta = data.checkpoints.map(cp => ({
      id: cp.id,
      name: cp.name,
      lat: cp.lat,
      lng: cp.lng,
      timestamp: cp.timestamp,
      description: cp.description,
    }));

    // Try Supabase first to get a canonical ID for deduplication
    let tripId = crypto.randomUUID();
    let savedToSupabase = false;

    if (user) {
      try {
        const tripPayload: any = {
          user_id: user.id,
          origin,
          destination,
          start_time: new Date(data.startTime).toISOString(),
          end_time: now,
          distance_km: distanceKm,
          duration_minutes: durationMinutes,
          route_coordinates: routeCoords,
          checkpoints: checkpointsMeta,
        };
        let trip: any;
        try {
          trip = await createTrip(tripPayload);
        } catch (e: any) {
          // If checkpoints column doesn't exist yet (migration not run), retry without it
          if (e?.code === 'PGRST204' || e?.message?.includes('checkpoints')) {
            const { checkpoints: _dropped, ...withoutCheckpoints } = tripPayload;
            trip = await createTrip(withoutCheckpoints);
          } else {
            throw e;
          }
        }
        tripId = trip.id;
        savedToSupabase = true;

        // Upload each photo that has a corresponding File
        for (const cp of data.checkpoints) {
          for (const photo of cp.photos) {
            const file = photoFilesRef.current.get(photo.id);
            if (file) {
              try {
                await uploadTripPhoto(
                  user.id,
                  tripId,
                  cp.id,
                  file,
                  photo.caption,
                  cp.lat,
                  cp.lng
                );
              } catch (err) {
                console.error("Photo upload failed:", err);
              }
            }
          }
        }
      } catch (err) {
        console.error("Supabase trip save failed, falling back to local:", err);
      }
    }

    // Always save locally (offline backup). Use the same ID so Journal
    // deduplication prevents showing the trip twice.
    saveLocalTrip({
      id: tripId,
      user_id: user?.id || "local",
      origin,
      destination,
      start_time: new Date(data.startTime).toISOString(),
      end_time: now,
      distance_km: distanceKm,
      duration_minutes: durationMinutes,
      route_coordinates: routeCoords,
      checkpoints: data.checkpoints,
    });

    photoFilesRef.current.clear();

    toast({
      title: savedToSupabase ? "Trip saved to your diary!" : "Trip saved locally!",
      description: savedToSupabase
        ? "Your journey and photos are in the cloud."
        : "Will sync when connection is available.",
    });
  };

  // Real GPS trip: Start / End
  const handleToggleTracking = () => {
    if (isTracking) {
      const finalData = endTrip();
      saveTripData(finalData);
      setIsTracking(false);
    } else {
      startTrip();
      setIsTracking(true);

      if (currentLocation) {
        addLocation({
          latitude: currentLocation[0],
          longitude: currentLocation[1],
          timestamp: Date.now(),
        });
      }

      toast({ title: "Trip started!", description: "Walk around — your route is being tracked." });
    }
  };

  // Simulation handlers
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
    saveTripData(finalData);
    setIsTracking(false);
  };

  // Add a checkpoint at current GPS location
  const handleAddCheckpoint = () => {
    if (!currentLocation) {
      toast({ title: "No location", description: "Waiting for GPS signal..." });
      return;
    }
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

  const handleAddPhotoToCheckpoint = (photo: CheckpointPhoto, file: File) => {
    if (!activeCheckpointId) return;
    addPhotoToCheckpoint(activeCheckpointId, photo);
    photoFilesRef.current.set(photo.id, file);
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

  // Show planned stops on map at all times; during simulation, hide ones already reached
  const upcomingCheckpoints = simState.isSimulating
    ? customCheckpoints.filter(sc => !simState.reachedCheckpoints.includes(sc.name))
    : customCheckpoints;

  return (
    <div className="relative w-full h-screen flex flex-col">
      <MapContainer center={center} zoom={15} className="flex-1 h-full w-full" zoomControl={false} attributionControl={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />
        <MapController currentLocation={currentLocation} shouldCenter={shouldCenter} />

        {polyPositions.length > 1 && (
          <>
            <Polyline positions={polyPositions} pathOptions={{ color: "#16a34a", weight: 7, opacity: 0.2, lineCap: "round", lineJoin: "round" }} />
            <Polyline positions={polyPositions} pathOptions={{ color: "#22c55e", weight: 4, opacity: 0.95, lineCap: "round", lineJoin: "round" }} />
          </>
        )}

        {currentLocation && (
          <Marker position={currentLocation} icon={currentLocationIcon} />
        )}

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
            {isTracking && !simState.isSimulating ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <h1 className="font-bold text-foreground text-sm">Tracking Live</h1>
              </div>
            ) : (
              <h1 className="font-bold text-foreground text-sm">Your Journey</h1>
            )}
          </div>
          <Button variant="icon" size="icon" onClick={handleRecenter} className="bg-white/90 backdrop-blur-xl shadow-sm rounded-xl border border-white/50">
            <Crosshair className="w-5 h-5" />
          </Button>
        </div>
        {locationError && !simState.isSimulating && (
          <div className="bg-amber-50/90 backdrop-blur-xl text-amber-800 text-xs px-3 py-2 rounded-xl text-center border border-amber-200/50 shadow-sm">
            Location access denied. Enable location in browser settings & use HTTPS.
          </div>
        )}
      </div>

      {/* Checkpoint reached banner (simulation) */}
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
          {showSimPanel ? "Hide" : "Demo"}
        </Button>

        {showSimPanel && (
          <div className="mt-2 bg-white/95 backdrop-blur-xl rounded-2xl p-3 shadow-lg w-64 border border-white/50">
            <p className="text-xs font-bold text-amber-800 mb-2">Trip Simulator (Demo)</p>

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

            <div className="flex gap-1.5">
              {!simState.isSimulating ? (
                <Button
                  variant="calm"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={handleStartSimulation}
                  disabled={isTracking}
                >
                  <Play className="w-3 h-3 mr-1" />
                  Start Demo
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
        {isTracking && (
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
        )}

        <div className="flex gap-2 mb-2">
          <AiNearbyPlaces
            currentLocation={currentLocation}
            onAddToRoute={addCustomCheckpoint}
          />
        </div>

        <div className="flex gap-2.5">
          {isTracking && !simState.isSimulating && (
            <Button
              variant="outline"
              size="lg"
              className="flex-1 h-12 rounded-xl bg-white/90 backdrop-blur-xl border-gray-200 shadow-sm font-semibold"
              onClick={handleAddCheckpoint}
            >
              <MapPin className="w-4 h-4 mr-1.5 text-green-600" />
              Checkpoint
            </Button>
          )}
          {!simState.isSimulating && (
            <Button
              variant={isTracking ? "destructive" : "calm"}
              size="lg"
              className={`h-12 rounded-xl shadow-sm font-semibold ${isTracking ? "flex-1" : "w-full"}`}
              onClick={handleToggleTracking}
            >
              {isTracking ? (
                <>
                  <Square className="w-4 h-4 mr-1.5" />
                  End Trip
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 mr-1.5" />
                  Start Trip
                </>
              )}
            </Button>
          )}
          {simState.isSimulating && (
            <Button
              variant="outline"
              size="lg"
              className="flex-1 h-12 rounded-xl bg-white/90 backdrop-blur-xl border-gray-200 shadow-sm font-semibold"
              onClick={handleAddCheckpoint}
            >
              <MapPin className="w-4 h-4 mr-1.5 text-green-600" />
              Checkpoint
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
