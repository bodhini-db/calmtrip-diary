import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FloatingCard } from "@/components/ui/floating-card";
import { StatCard } from "@/components/ui/stat-card";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TrendingUp, MapPin, Calendar, Footprints, Camera, Download, Share2, FileJson, FileSpreadsheet, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getTrips, getPhotos, getPrivacySettings, updatePrivacySettings } from "@/lib/api";
import { calculateInsights, formatDistance } from "@/lib/insights";
import { getLocalTrips } from "@/lib/localTrips";

const Stats = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [insights, setInsights] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [privacySettings, setPrivacySettings] = useState<any>(null);
  const [shareData, setShareData] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

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
      let allTrips: any[] = [];
      try {
        const supabaseTrips = await getTrips(user.id);
        allTrips = supabaseTrips;
      } catch {
        // Supabase unavailable
      }

      // Merge local trips
      const localTrips = getLocalTrips(user.id);
      for (const lt of localTrips) {
        if (!allTrips.some((t: any) => t.id === lt.id)) {
          allTrips.push(lt);
        }
      }

      setTrips(allTrips);

      const allPhotos = await Promise.all(
        allTrips.filter((t: any) => !t._local).map((trip: any) => getPhotos(trip.id))
      ).then(results => results.flat()).catch(() => []);

      const newInsights = calculateInsights(allTrips, allPhotos);
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

  const handleExportJSON = () => {
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
    window.URL.revokeObjectURL(url);
    setExportDialogOpen(false);
    toast.success("JSON data exported!");
  };

  const handleExportCSV = () => {
    if (!trips.length) return;

    const headers = ["Date", "Origin", "Destination", "Distance (km)", "Duration (min)", "Stops", "Photos"];
    const rows = trips.map((trip: any) => {
      const checkpoints = trip._checkpoints || trip.checkpoints || [];
      const photos = checkpoints.reduce((sum: number, cp: any) => sum + (cp.photos?.length || 0), 0);
      return [
        new Date(trip.created_at).toLocaleDateString(),
        trip.origin || "",
        trip.destination || "",
        (trip.distance_km || 0).toFixed(2),
        trip.duration_minutes || 0,
        checkpoints.length,
        photos,
      ].map(v => `"${v}"`).join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calmtrip-trips-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setExportDialogOpen(false);
    toast.success("CSV data exported!");
  };

  const handleShareReport = async () => {
    if (!insights) return;

    const text = [
      "My CalmTrip Travel Report",
      "========================",
      "",
      `Total Distance: ${formatDistance(insights.totalDistanceKm)}`,
      `Total Trips: ${insights.tripCount}`,
      `Photos Captured: ${insights.totalPhotos}`,
      `Travel Style: ${insights.travelFrequency}`,
      insights.mostVisitedLocation ? `Favorite Place: ${insights.mostVisitedLocation}` : "",
      `This Week: ${formatDistance(insights.weeklyDistance)}`,
      `This Month: ${formatDistance(insights.monthlyDistance)}`,
      "",
      "Tracked with CalmTrip - mindful travel journaling",
    ].filter(Boolean).join("\n");

    if (navigator.share) {
      try {
        await navigator.share({ title: "My CalmTrip Report", text });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }
    await navigator.clipboard.writeText(text);
    toast.success("Travel report copied to clipboard!");
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

        {/* Trip Activity Chart */}
        {insights && insights.tripsPerDayOfWeek && (
          <section>
            <h2 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Trip Activity
            </h2>
            <FloatingCard className="p-4">
              <p className="text-sm text-muted-foreground mb-3">Trips by day of the week</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={insights.tripsPerDayOfWeek} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#6b7280" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      fontSize: "13px",
                    }}
                    formatter={(value: number) => [`${value} trip${value !== 1 ? "s" : ""}`, "Trips"]}
                  />
                  <Bar dataKey="trips" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </FloatingCard>
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
                  onClick={() => setExportDialogOpen(true)}
                >
                  <Download className="w-4 h-4" />
                  Export Data
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleShareReport}
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

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Export Your Data</DialogTitle>
            <DialogDescription>
              Choose a format to download your travel data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <button
              onClick={handleExportJSON}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-emerald-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <FileJson className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">JSON Format</h3>
                <p className="text-xs text-muted-foreground">Full insights data with all details</p>
              </div>
            </button>
            <button
              onClick={handleExportCSV}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-blue-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">CSV Format</h3>
                <p className="text-xs text-muted-foreground">Trip table for spreadsheets</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Stats;
