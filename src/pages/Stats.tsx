import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FloatingCard } from "@/components/ui/floating-card";
import { StatCard } from "@/components/ui/stat-card";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { TrendingUp, MapPin, Calendar, Footprints, Camera, Download, Share2 } from "lucide-react";
import { getTrips, getPhotos, getPrivacySettings, updatePrivacySettings } from "@/lib/api";
import { calculateInsights, formatDistance } from "@/lib/insights";

const Stats = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [insights, setInsights] = useState<any>(null);
  const [privacySettings, setPrivacySettings] = useState<any>(null);
  const [shareData, setShareData] = useState(false);

  useEffect(() => {
    if (!user && !loading) {
      navigate("/");
      return;
    }

    if (user) {
      loadData();
    }
  }, [user, loading, navigate]);

  const loadData = async () => {
    if (!user) return;
    try {
      const trips = await getTrips(user.id);
      const allPhotos = await Promise.all(
        trips.map((trip: any) => getPhotos(trip.id))
      ).then(results => results.flat());

      const newInsights = calculateInsights(trips, allPhotos);
      setInsights(newInsights);

      const settings = await getPrivacySettings(user.id);
      setPrivacySettings(settings);
      setShareData(settings?.allow_anonymous_sharing || false);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleShareToggle = async (checked: boolean) => {
    setShareData(checked);
    if (user && privacySettings) {
      try {
        await updatePrivacySettings(user.id, {
          ...privacySettings,
          allow_anonymous_sharing: checked,
        });
      } catch (error) {
        console.error("Error updating privacy settings:", error);
      }
    }
  };

  const handleExportData = () => {
    if (!insights) return;

    const data = {
      exportDate: new Date().toISOString(),
      insights: insights,
      privacyNote: "This data is anonymized and for your personal use.",
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calmtrip-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading insights...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="safe-top px-4 py-6">
        <h1 className="font-display font-bold text-2xl text-foreground mb-1">Your Insights</h1>
        <p className="text-muted-foreground">Travel analytics & research</p>
      </header>

      <main className="px-4 space-y-6">
        {/* Main Message */}
        {insights && (
          <motion.div
            className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">✨</span>
              <div>
                <h2 className="font-semibold text-foreground">{insights.friendlyMessage}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  You're a {insights.travelFrequency} exploring the world mindfully.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Stats */}
        {insights && (
          <section>
            <h2 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Overview
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={<Footprints className="w-4 h-4" />}
                label="Total Distance"
                value={formatDistance(insights.totalDistanceKm)}
              />
              <StatCard
                icon={<Calendar className="w-4 h-4" />}
                label="Trips"
                value={insights.tripCount.toString()}
              />
              <StatCard
                icon={<MapPin className="w-4 h-4" />}
                label="Favorite Place"
                value={insights.mostVisitedLocation || "Exploring..."}
              />
              <StatCard
                icon={<Camera className="w-4 h-4" />}
                label="Photos"
                value={insights.totalPhotos.toString()}
              />
            </div>
          </section>
        )}

        {/* Monthly Stats */}
        {insights && (
          <section>
            <h2 className="font-display font-semibold text-foreground mb-3">Monthly Activity</h2>
            <FloatingCard className="p-4 space-y-3">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">This Week</span>
                  <span className="font-semibold text-foreground">
                    {formatDistance(insights.weeklyDistance)}
                  </span>
                </div>
                <div className="w-full bg-sage/20 rounded-full h-2">
                  <motion.div
                    className="bg-forest rounded-full h-2"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((insights.weeklyDistance / 100) * 100, 100)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">This Month</span>
                  <span className="font-semibold text-foreground">
                    {formatDistance(insights.monthlyDistance)}
                  </span>
                </div>
                <div className="w-full bg-sage/20 rounded-full h-2">
                  <motion.div
                    className="bg-forest rounded-full h-2"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((insights.monthlyDistance / 300) * 100, 100)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            </FloatingCard>
          </section>
        )}

        {/* Privacy & Research */}
        <section>
          <h2 className="font-display font-semibold text-foreground mb-3">Privacy & Research</h2>
          <FloatingCard className="p-4 space-y-4">
            <div className="border-b border-border/50 pb-4">
              <ToggleSwitch
                checked={shareData}
                onChange={handleShareToggle}
                label="Share Anonymized Data"
                description="Help improve urban planning through anonymized travel insights (SDG 9)"
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                🔒 Your data is always encrypted and stays on Supabase servers. We never sell personal information.
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleExportData}
                >
                  <Download className="w-4 h-4" />
                  Export Data
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Share2 className="w-4 h-4" />
                  Share Report
                </Button>
              </div>
            </div>
          </FloatingCard>
        </section>

        {/* About */}
        <section>
          <FloatingCard className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-2">
              CalmTrip v1.0 • Made with 💚 for mindful travelers
            </p>
            <p className="text-xs text-muted-foreground">
              Privacy-first • Open source • No tracking ads
            </p>
          </FloatingCard>
        </section>
      </main>
    </div>
  );
};

export default Stats;
