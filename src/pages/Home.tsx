import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Bell, Navigation, MapPin, ChevronRight, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingCard } from "@/components/ui/floating-card";
import { StatCard } from "@/components/ui/stat-card";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTripDetector } from "@/hooks/useTripDetector";
import { getTrips, getPhotos } from "@/lib/api";
import { calculateInsights, formatDistance } from "@/lib/insights";
import { signOut } from "@/lib/supabase";
import mapPreview from "@/assets/map-preview.jpg";

export default function Home() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { tripData, startTracking, stopTracking } = useTripDetector();
  const [trips, setTrips] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [userName, setUserName] = useState("Traveler");

  useEffect(() => {
    if (!user && !loading) {
      navigate("/");
      return;
    }

    if (user) {
      // Load user data
      const email = user.email?.split("@")[0] || "Traveler";
      setUserName(email.charAt(0).toUpperCase() + email.slice(1));

      // Load trips and photos
      loadUserData();

      // Start location tracking
      startTracking();
    }

    return () => stopTracking();
  }, [user, loading, navigate]);

  const loadUserData = async () => {
    if (!user) return;
    try {
      const userTrips = await getTrips(user.id);
      setTrips(userTrips);

      // Load all photos from all trips
      const allPhotos = await Promise.all(
        userTrips.map((trip: any) => getPhotos(trip.id))
      ).then(results => results.flat());
      setPhotos(allPhotos);

      // Calculate insights
      const newInsights = calculateInsights(userTrips, allPhotos);
      setInsights(newInsights);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

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

  const recentTrips = trips.slice(0, 2);
  const todayDistance = tripData.distance / 1000; // Convert to km

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="safe-top px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-forest to-sage flex items-center justify-center text-white font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Welcome back</p>
            <h1 className="font-display font-bold text-foreground">Good {new Date().getHours() < 12 ? "morning" : "afternoon"}, {userName}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="icon" size="icon">
            <Bell className="w-5 h-5" />
          </Button>
          <Button
            variant="icon"
            size="icon"
            onClick={handleSignOut}
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

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
            
            {/* Active Tracking Badge */}
            {tripData.isActive && (
              <motion.div
                className="absolute top-3 left-3 flex items-center gap-2 bg-forest text-white px-3 py-1.5 rounded-full text-xs font-medium"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                ACTIVE TRACK
              </motion.div>
            )}

            {/* Location Label */}
            <div className="absolute bottom-3 left-3 text-white">
              <p className="text-sm opacity-80">{insights?.mostVisitedLocation || "Exploring"}</p>
            </div>
          </div>

          {/* Journey Info */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Today's Discovery</p>
                <h2 className="font-display font-bold text-lg text-foreground">Today's Journey</h2>
                <p className="text-sm text-muted-foreground">
                  {formatDistance(todayDistance)} traveled{tripData.isActive ? " (ongoing)" : ""}
                </p>
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

        {/* Insights */}
        {insights && (
          <section>
            <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-forest" />
              Your Journey
            </h3>
            <div className="space-y-2 mb-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-sm text-emerald-900">{insights.friendlyMessage}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={<MapPin className="w-4 h-4" />}
                label="Total Distance"
                value={formatDistance(insights.totalDistanceKm)}
                trend={`${insights.tripCount} trips`}
                trendUp
              />
              <StatCard
                icon={<Navigation className="w-4 h-4" />}
                label="This Week"
                value={formatDistance(insights.weeklyDistance)}
                trend={`${Math.round(insights.weeklyDistance / 7)}km/day`}
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
                Recent Trips
              </h3>
              <Link to="/journal" className="text-sm text-forest font-medium flex items-center gap-1">
                See all
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentTrips.map((trip: any) => (
                <TripCard
                  key={trip.id}
                  title={trip.destination || "Unnamed Trip"}
                  distance={trip.distance_km}
                  time={new Date(trip.created_at).toLocaleDateString()}
                  duration={trip.duration_minutes}
                />
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
            <Button variant="calm" onClick={() => startTracking()}>
              Start Tracking
            </Button>
          </section>
        )}
      </main>
    </div>
  );
}

interface TripCardProps {
  title: string;
  distance: number;
  time: string;
  duration: number;
}

function TripCard({ title, distance, time, duration }: TripCardProps) {
  return (
    <motion.div
      className="flex items-center gap-3 bg-card rounded-xl p-4 shadow-soft"
      whileHover={{ x: 4 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center text-xl">
        🗺️
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground truncate">{title}</h4>
        <p className="text-sm text-muted-foreground">
          {formatDistance(distance)} • {duration}m • {time}
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
    </motion.div>
  );
}
