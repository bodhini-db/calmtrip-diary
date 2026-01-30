import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FloatingCard } from "@/components/ui/floating-card";
import { ChevronRight, Calendar, MapPin, Image as ImageIcon } from "lucide-react";
import { getTrips, getPhotos } from "@/lib/api";
import { PhotoViewer } from "@/components/PhotoViewer";

const Journal = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [viewerPhotos, setViewerPhotos] = useState<any[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [showViewer, setShowViewer] = useState(false);

  useEffect(() => {
    if (!user && !loading) {
      navigate("/");
      return;
    }

    if (user) {
      loadTrips();
    }
  }, [user, loading, navigate]);

  const loadTrips = async () => {
    if (!user) return;
    try {
      const userTrips = await getTrips(user.id);
      setTrips(userTrips);
      if (userTrips.length > 0) {
        setSelectedTrip(userTrips[0].id);
        loadPhotos(userTrips[0].id);
      }
    } catch (error) {
      console.error("Error loading trips:", error);
    }
  };

  const loadPhotos = async (tripId: string) => {
    try {
      const tripPhotos = await getPhotos(tripId);
      setPhotos(tripPhotos);
      setViewerPhotos(
        tripPhotos.map((p: any) => ({
          id: p.id,
          url: p.storage_path,
          caption: p.caption,
          emoji: p.emoji_mood,
        }))
      );
    } catch (error) {
      console.error("Error loading photos:", error);
    }
  };

  const handleTripSelect = (tripId: string) => {
    setSelectedTrip(tripId);
    loadPhotos(tripId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading diary...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="safe-top px-4 py-6">
        <h1 className="font-display font-bold text-2xl text-foreground mb-2">Travel Diary</h1>
        <p className="text-muted-foreground">Your journey moments, preserved</p>
      </header>

      <main className="px-4 space-y-6">
        {/* Trips List */}
        {trips.length > 0 ? (
          <div className="space-y-3">
            {trips.map((trip: any, idx: number) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => handleTripSelect(trip.id)}
                className={`p-4 rounded-xl cursor-pointer transition-all ${
                  selectedTrip === trip.id
                    ? "bg-gradient-to-r from-emerald-50 to-blue-50 border-2 border-forest"
                    : "bg-card border border-transparent hover:border-sage"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center text-xl">
                    🗺️
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{trip.destination || "Unnamed Trip"}</h3>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(trip.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {trip.distance_km?.toFixed(1)}km
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-transform ${selectedTrip === trip.id ? "rotate-90" : ""}`} />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <FloatingCard className="text-center py-12">
            <div className="text-6xl mb-4">📔</div>
            <h3 className="font-semibold text-foreground mb-2">No trips yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start tracking a journey to create diary entries
            </p>
            <Button variant="calm" onClick={() => navigate("/map")}>
              Start Trip
            </Button>
          </FloatingCard>
        )}

        {/* Photos Grid */}
        {selectedTrip && photos.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Moments ({photos.length})
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo: any, idx: number) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => {
                    setSelectedPhotoIndex(idx);
                    setShowViewer(true);
                  }}
                  className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                >
                  <img
                    src={photo.storage_path}
                    alt="Moment"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                  {photo.emoji_mood && (
                    <div className="absolute bottom-1 right-1 text-lg">{photo.emoji_mood}</div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {selectedTrip && photos.length === 0 && (
          <FloatingCard className="text-center py-8">
            <p className="text-muted-foreground mb-3">No photos yet</p>
            <Button size="sm" variant="outline" onClick={() => navigate("/map")}>
              Add Photos
            </Button>
          </FloatingCard>
        )}
      </main>

      {/* Photo Viewer Modal */}
      {showViewer && (
        <PhotoViewer
          photos={viewerPhotos}
          initialIndex={selectedPhotoIndex}
          onClose={() => setShowViewer(false)}
        />
      )}
    </div>
  );
};

export default Journal;

