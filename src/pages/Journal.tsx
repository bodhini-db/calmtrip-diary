import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FloatingCard } from "@/components/ui/floating-card";
import { ChevronLeft, Share2, MapPin, Image as ImageIcon, Clock, Navigation, Camera } from "lucide-react";
import { getTrips, getPhotos } from "@/lib/api";
import { getLocalTrips } from "@/lib/localTrips";
import { PhotoViewer } from "@/components/PhotoViewer";

const Journal = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);
  const [viewerPhotos, setViewerPhotos] = useState<any[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [showViewer, setShowViewer] = useState(false);

  useEffect(() => {
    if (!user && !loading) {
      navigate("/");
      return;
    }
    if (user) loadTrips();
  }, [user, loading, navigate]);

  const loadTrips = async () => {
    if (!user) return;

    let allTrips: any[] = [];
    try {
      const supabaseTrips = await getTrips(user.id);
      allTrips = supabaseTrips;
    } catch {
      // Supabase unavailable
    }

    const localTrips = getLocalTrips(user.id);
    const localAsTrips = localTrips.map(lt => ({
      id: lt.id,
      user_id: lt.user_id,
      origin: lt.origin,
      destination: lt.destination,
      start_time: lt.start_time,
      end_time: lt.end_time,
      distance_km: lt.distance_km,
      duration_minutes: lt.duration_minutes,
      route_coordinates: lt.route_coordinates,
      created_at: lt.created_at,
      _local: true,
      _checkpoints: lt.checkpoints,
    }));

    const merged = [...allTrips];
    for (const lt of localAsTrips) {
      if (!merged.some(t => t.id === lt.id)) merged.push(lt);
    }
    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setTrips(merged);
  };

  const getTripPhotos = (trip: any) => {
    if (trip._local && trip._checkpoints) {
      return trip._checkpoints.flatMap((cp: any) =>
        (cp.photos || []).map((p: any) => ({
          id: p.id,
          url: p.objectUrl,
          caption: p.caption || cp.name,
          checkpointName: cp.name,
        }))
      );
    }
    return [];
  };

  const getTripCheckpoints = (trip: any) => {
    if (trip._local && trip._checkpoints) return trip._checkpoints;
    return [];
  };

  const getTotalPhotos = (trip: any) => {
    if (trip._local && trip._checkpoints) {
      return trip._checkpoints.reduce((sum: number, cp: any) => sum + (cp.photos?.length || 0), 0);
    }
    return 0;
  };

  const openPhotoViewer = (trip: any, photoIndex: number) => {
    const photos = getTripPhotos(trip);
    setViewerPhotos(photos);
    setSelectedPhotoIndex(photoIndex);
    setShowViewer(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading diary...</p>
      </div>
    );
  }

  // Timeline detail view for a selected trip
  if (selectedTrip) {
    const checkpoints = getTripCheckpoints(selectedTrip);
    const allPhotos = getTripPhotos(selectedTrip);
    const totalPhotos = getTotalPhotos(selectedTrip);

    return (
      <div className="min-h-screen bg-background pb-20">
        {/* Trip Header */}
        <header className="safe-top px-4 py-4">
          <div className="flex items-center justify-between mb-6">
            <Button variant="icon" size="icon" onClick={() => setSelectedTrip(null)}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-display font-bold text-foreground">
              {selectedTrip.destination || selectedTrip.origin || "Trip"}
            </h1>
            <Button variant="icon" size="icon">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>

          {/* Trip Hero */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center text-3xl shadow-md">
              🗺️
            </div>
            <h2 className="font-display font-bold text-xl text-foreground">
              {selectedTrip.destination || selectedTrip.origin}
            </h2>
            <p className="text-sm text-emerald-600 font-medium mt-1">
              {new Date(selectedTrip.start_time || selectedTrip.created_at).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </p>
            <div className="flex justify-center gap-3 mt-3">
              <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-medium border border-emerald-200">
                {checkpoints.length} Stops
              </span>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-medium border border-emerald-200">
                {totalPhotos} Photos
              </span>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-medium border border-emerald-200">
                {selectedTrip.distance_km?.toFixed(1)}km
              </span>
            </div>
          </motion.div>
        </header>

        {/* Timeline */}
        <main className="px-4">
          {checkpoints.length > 0 ? (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-400 via-emerald-300 to-emerald-100" />

              <div className="space-y-0">
                {checkpoints.map((cp: any, idx: number) => {
                  const cpPhotos = (cp.photos || []);
                  const time = cp.timestamp
                    ? new Date(cp.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                    : "";

                  return (
                    <motion.div
                      key={cp.id || idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.15 }}
                      className="relative pl-12 pb-8"
                    >
                      {/* Timeline dot */}
                      <div className="absolute left-2.5 top-1 w-4 h-4 rounded-full bg-emerald-500 border-[3px] border-white shadow-sm z-10" />

                      {/* Timestamp */}
                      {time && (
                        <p className="text-xs font-semibold text-emerald-600 mb-1">{time}</p>
                      )}

                      {/* Checkpoint name */}
                      <h3 className="font-display font-bold text-foreground text-base mb-1">
                        Arrived at {cp.name}
                      </h3>

                      {/* Description */}
                      {cp.description && (
                        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                          {cp.description}
                        </p>
                      )}

                      {/* Photos */}
                      {cpPhotos.length > 0 && (
                        <div className={`mt-2 ${cpPhotos.length === 1 ? "" : "grid grid-cols-2 gap-2"}`}>
                          {cpPhotos.map((photo: any, pIdx: number) => {
                            const globalIdx = allPhotos.findIndex((p: any) => p.id === photo.id);
                            return (
                              <motion.div
                                key={photo.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.15 + pIdx * 0.05 }}
                                onClick={() => openPhotoViewer(selectedTrip, globalIdx >= 0 ? globalIdx : 0)}
                                className={`relative rounded-xl overflow-hidden cursor-pointer group shadow-sm ${
                                  cpPhotos.length === 1 ? "aspect-[16/10]" : "aspect-square"
                                }`}
                              >
                                <img
                                  src={photo.objectUrl}
                                  alt={photo.caption || cp.name}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                              </motion.div>
                            );
                          })}
                        </div>
                      )}

                      {cpPhotos.length === 0 && idx < checkpoints.length - 1 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Navigation className="w-3 h-3" />
                          <span>Continuing journey...</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}

                {/* Trip end marker */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: checkpoints.length * 0.15 }}
                  className="relative pl-12 pb-4"
                >
                  <div className="absolute left-2 top-1 w-5 h-5 rounded-full bg-emerald-100 border-[3px] border-emerald-500 z-10 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-xs font-semibold text-emerald-600">Trip completed</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedTrip.distance_km?.toFixed(1)}km traveled
                    {selectedTrip.duration_minutes ? ` in ${selectedTrip.duration_minutes} min` : ""}
                  </p>
                </motion.div>
              </div>
            </div>
          ) : (
            <FloatingCard className="text-center py-8">
              <Camera className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No checkpoints recorded for this trip</p>
            </FloatingCard>
          )}
        </main>

        {showViewer && (
          <PhotoViewer
            photos={viewerPhotos}
            initialIndex={selectedPhotoIndex}
            onClose={() => setShowViewer(false)}
          />
        )}
      </div>
    );
  }

  // Trip list view
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="safe-top px-4 py-6">
        <h1 className="font-display font-bold text-2xl text-foreground mb-1">Travel Diary</h1>
        <p className="text-sm text-muted-foreground">Your journey moments, preserved</p>
      </header>

      <main className="px-4 space-y-3">
        {trips.length > 0 ? (
          trips.map((trip: any, idx: number) => {
            const checkpoints = getTripCheckpoints(trip);
            const totalPhotos = getTotalPhotos(trip);
            const firstPhoto = checkpoints.find((cp: any) => cp.photos?.length > 0)?.photos?.[0];

            return (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                onClick={() => setSelectedTrip(trip)}
                className="bg-card rounded-2xl overflow-hidden shadow-soft cursor-pointer active:scale-[0.98] transition-transform border border-border/50"
              >
                {/* Trip cover image or gradient */}
                {firstPhoto ? (
                  <div className="relative h-36">
                    <img
                      src={firstPhoto.objectUrl}
                      alt={trip.destination}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-display font-bold text-white text-lg leading-tight">
                        {trip.destination || trip.origin || "Trip"}
                      </h3>
                      <p className="text-white/80 text-xs mt-0.5">
                        {new Date(trip.created_at).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-28 bg-gradient-to-br from-emerald-50 to-blue-50">
                    <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-30">
                      🗺️
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-display font-bold text-foreground text-lg leading-tight">
                        {trip.destination || trip.origin || "Trip"}
                      </h3>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {new Date(trip.created_at).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Trip info */}
                <div className="p-3">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-emerald-500" />
                      {trip.distance_km?.toFixed(1)}km
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-500" />
                      {trip.duration_minutes || 0}min
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-500" />
                      {checkpoints.length} stops
                    </span>
                    <span className="flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-emerald-500" />
                      {totalPhotos}
                    </span>
                  </div>

                  {/* Checkpoint pills */}
                  {checkpoints.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {checkpoints.map((cp: any, i: number) => (
                        <span
                          key={i}
                          className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium"
                        >
                          {cp.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        ) : (
          <FloatingCard className="text-center py-16">
            <div className="text-6xl mb-4">📔</div>
            <h3 className="font-display font-semibold text-foreground mb-2">No trips yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Start a journey to fill your travel diary
            </p>
            <Button variant="calm" onClick={() => navigate("/map")}>
              <MapPin className="w-4 h-4 mr-2" />
              Start Trip
            </Button>
          </FloatingCard>
        )}
      </main>
    </div>
  );
};

export default Journal;
