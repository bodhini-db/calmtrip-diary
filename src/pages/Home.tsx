import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Bell, Navigation, MapPin, ChevronRight, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingCard } from "@/components/ui/floating-card";
import { StatCard } from "@/components/ui/stat-card";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { getTrips, getTripPhotosList, getPhotoPublicUrl, getProfileFromUser } from "@/lib/api";
import { Trip } from "@/lib/supabase";
import { formatDistance } from "@/lib/insights";
import { AiTripPlanner } from "@/components/AiTripPlanner";
import { ProfileDialog } from "@/components/ProfileDialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import mapPreview from "@/assets/map-preview.jpg";
import { TreeOnlyCard } from "@/components/living-journey/TreeOnlyCard";

export default function Home() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: profileRow } = useUserProfile(user?.id);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  const profile = user ? getProfileFromUser(user) : null;
  const displayName =
    profileRow?.full_name || profile?.full_name || user?.email?.split("@")[0] || "Traveler";
  const avatarUrl = profileRow?.avatar_url ?? profile?.avatar_url;

  useEffect(() => {
    if (!user && !loading) {
      navigate("/");
      return;
    }

    if (user) {
      // Load trips from Supabase and preload cover photos
      const loadTrips = async () => {
        try {
          const remote = await getTrips(user.id);

          // Preload first photo for each trip to show as cover
          const tripsWithCovers = await Promise.all(
            (remote as any[]).map(async (trip) => {
              try {
                const photos = await getTripPhotosList(trip.id);
                const firstPhoto = photos[0];
                if (firstPhoto) {
                  return {
                    ...trip,
                    coverUrl: getPhotoPublicUrl(firstPhoto.storage_path),
                  };
                }
                return trip;
              } catch {
                return trip; // fallback: no cover photo
              }
            })
          );

          const sorted = tripsWithCovers.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          setTrips(sorted as any);
        } catch (error) {
          console.error("Failed to load trips:", error);
          setTrips([]);
        }
      };

      loadTrips();
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🧳</div>
          <p className="text-muted-foreground">Loading your journeys...</p>
        </div>
      </div>
    );
  }

  const recentTrips = trips.slice(0, 3);
  const totalDistance = trips.reduce((sum, t) => sum + (t.distance_km || 0), 0);
  const totalPhotos = trips.reduce(
    (sum, t) => sum + ((t as any).checkpoints || []).reduce((s: number, cp: any) => s + (cp.photos?.length ?? 0), 0),
    0
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="safe-top px-4 py-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowProfileDialog(true)}
          className="flex items-center gap-3 text-left"
        >
          <Avatar className="h-10 w-10 border-2 border-emerald-100">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt="Profile" />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-forest to-sage text-white font-bold">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Welcome back</p>
            <h1 className="font-display font-bold text-foreground">Good {new Date().getHours() < 12 ? "morning" : "afternoon"}, {displayName}</h1>
          </div>
        </button>
        <div className="flex gap-2">
          <Button variant="icon" size="icon">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="icon" size="icon" onClick={() => navigate("/")} title="Sign out">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {user && (
        <ProfileDialog
          open={showProfileDialog}
          onOpenChange={setShowProfileDialog}
          user={user}
          onProfileUpdated={() => {}}
        />
      )}

      {/* Main Content */}
      <main className="px-4 space-y-6 pb-8">
        {/* Today's Journey Card */}
        <FloatingCard className="p-0 overflow-hidden">
          <div className="relative h-48">
            <img
              src={mapPreview}
              alt="Today's journey map"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-3 left-3 text-white">
              <p className="text-sm opacity-80">Exploring</p>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Today's Discovery</p>
                <h2 className="font-display font-bold text-lg text-foreground">Today's Journey</h2>
                <p className="text-sm text-muted-foreground">Tap to start a new trip</p>
              </div>
              <Link to="/map">
                <Button variant="calm" size="sm">
                  View Map
                  <Navigation className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </FloatingCard>

        {/* AI Trip Planner */}
        <AiTripPlanner
          pastTripSummary={
            trips.length > 0
              ? `${trips.length} trips, favourite areas: ${[...new Set(trips.map((t: any) => t.destination || t.origin).filter(Boolean))].slice(0, 3).join(", ")}`
              : ""
          }
        />

        <TreeOnlyCard totalKm={totalDistance} />

        {/* Stats */}
        {trips.length > 0 && (
          <section>
            <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-forest" />
              Your Journey
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={<MapPin className="w-4 h-4" />}
                label="Total Distance"
                value={formatDistance(totalDistance)}
                trend={`${trips.length} trips`}
                trendUp
              />
              <StatCard
                icon={<Navigation className="w-4 h-4" />}
                label="Total Photos"
                value={`${totalPhotos}`}
                trend={`${trips.reduce((s, t) => s + (t.checkpoints?.length || 0), 0)} stops`}
                trendUp
              />
            </div>
          </section>
        )}

        {/* Recent Trips */}
        {recentTrips.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-forest" />
                Recent Diary Entries
              </h3>
              <Link to="/journal" className="text-sm text-forest font-medium flex items-center gap-1">
                See all
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentTrips.map((trip) => (
                <motion.div
                  key={trip.id}
                  className="flex items-center gap-3 bg-card rounded-xl p-4 shadow-soft cursor-pointer"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  onClick={() => navigate("/journal")}
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center text-xl shrink-0">
                    {(trip as any).coverUrl ? (
                      <img
                        src={(trip as any).coverUrl}
                        className="w-full h-full object-cover rounded-lg"
                        alt=""
                      />
                    ) : (
                      "🗺️"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">
                      {trip.destination || trip.origin || "Trip"}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {formatDistance(trip.distance_km)} &bull; {trip.duration_minutes}min &bull; {new Date(trip.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {recentTrips.length === 0 && (
          <section className="text-center py-12">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="font-semibold text-foreground mb-2">No trips yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start a journey and CalmTrip will track it automatically
            </p>
            <Button variant="calm" onClick={() => navigate("/map")}>
              <MapPin className="w-4 h-4 mr-2" />
              Start Trip
            </Button>
          </section>
        )}
      </main>
    </div>
  );
}
