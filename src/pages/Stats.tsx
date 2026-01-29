import { motion } from "framer-motion";
import { ChevronLeft, TrendingUp, MapPin, Calendar, Footprints, Camera, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingCard } from "@/components/ui/floating-card";
import { StatCard } from "@/components/ui/stat-card";
import { Link } from "react-router-dom";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { useState } from "react";

const monthlyData = [
  { month: "Mar", value: 30 },
  { month: "Apr", value: 45 },
  { month: "May", value: 65 },
  { month: "Jun", value: 40 },
  { month: "Jul", value: 80 },
  { month: "Aug", value: 55 },
];

const topLocations = [
  { name: "Marina District", visits: 12, emoji: "🌉" },
  { name: "Golden Gate Park", visits: 8, emoji: "🌳" },
  { name: "Fisherman's Wharf", visits: 6, emoji: "🦀" },
];

export default function Stats() {
  const [shareData, setShareData] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="safe-top px-4 py-4 flex items-center justify-between border-b border-border/50">
        <Link to="/home">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="font-display font-bold text-lg">Reports & Research</h1>
        <div className="w-10" />
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Travel Insights Header */}
        <div>
          <h2 className="font-display font-bold text-xl text-foreground">Travel Insights</h2>
          <p className="text-sm text-muted-foreground">Your activity summary for January</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<MapPin className="w-4 h-4" />}
            label="Total Trips"
            value="12"
          />
          <StatCard
            icon={<Calendar className="w-4 h-4" />}
            label="Countries"
            value="4"
          />
        </div>

        {/* Monthly Distance Chart */}
        <FloatingCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Monthly Distance</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold font-display">2,450 km</span>
                <span className="text-xs text-forest bg-mint px-2 py-0.5 rounded-full">+12%</span>
              </div>
            </div>
            <TrendingUp className="w-5 h-5 text-forest" />
          </div>

          {/* Simple Bar Chart */}
          <div className="flex items-end justify-between gap-2 h-24">
            {monthlyData.map((item, index) => (
              <motion.div
                key={item.month}
                className="flex-1 flex flex-col items-center gap-1"
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                transition={{ delay: index * 0.1 }}
              >
                <motion.div
                  className="w-full bg-gradient-to-t from-forest to-sage rounded-t-md"
                  initial={{ height: 0 }}
                  animate={{ height: `${item.value}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  style={{ minHeight: 8 }}
                />
                <span className="text-[10px] text-muted-foreground">{item.month}</span>
              </motion.div>
            ))}
          </div>
        </FloatingCard>

        {/* Research Contribution */}
        <FloatingCard>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-mint flex items-center justify-center">
              <Share2 className="w-5 h-5 text-forest" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Research Contribution</h3>
              <p className="text-sm text-muted-foreground">Help Urban Planning</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Share anonymized travel patterns to help build better urban infrastructure. Your identity is 100% protected.
          </p>
          <ToggleSwitch
            checked={shareData}
            onChange={setShareData}
            label="Data is aggregated and stripped of all personal identifiers before sharing."
          />
        </FloatingCard>

        {/* Top Locations */}
        <section>
          <h3 className="font-display font-semibold text-foreground mb-3">Most Visited</h3>
          <div className="space-y-2">
            {topLocations.map((location, index) => (
              <motion.div
                key={location.name}
                className="flex items-center gap-3 bg-card rounded-xl p-3 shadow-soft"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <span className="text-2xl">{location.emoji}</span>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{location.name}</p>
                  <p className="text-xs text-muted-foreground">{location.visits} visits</p>
                </div>
                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-forest to-sage rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(location.visits / 12) * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Export Options */}
        <section>
          <h3 className="font-display font-semibold text-foreground mb-3">Export Data</h3>
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 bg-card rounded-xl p-4 shadow-soft text-left hover:bg-mint/20 transition-colors">
              <Download className="w-5 h-5 text-forest" />
              <span className="font-medium text-foreground">Download PDF Report</span>
            </button>
            <button className="w-full flex items-center gap-3 bg-card rounded-xl p-4 shadow-soft text-left hover:bg-mint/20 transition-colors">
              <Download className="w-5 h-5 text-forest" />
              <span className="font-medium text-foreground">Export CSV Data</span>
            </button>
          </div>
        </section>

        {/* Share Button */}
        <Button variant="calm" className="w-full" size="lg">
          <Share2 className="w-4 h-4" />
          Share Summary Report
        </Button>
      </main>
    </div>
  );
}
