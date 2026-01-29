import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, User, MapPin, Bell, Shield, HelpCircle, LogOut, Moon, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { useState } from "react";

const settingsGroups = [
  {
    title: "Account",
    items: [
      { icon: User, label: "Edit Profile", path: "/profile" },
      { icon: Bell, label: "Notifications", path: "/notifications" },
      { icon: Shield, label: "Privacy & Security", path: "/privacy" },
    ],
  },
  {
    title: "Tracking",
    items: [
      { icon: MapPin, label: "Location Settings", path: "/location" },
      { icon: Smartphone, label: "Battery Optimization", path: "/battery" },
    ],
  },
  {
    title: "Support",
    items: [
      { icon: HelpCircle, label: "Help Center", path: "/help" },
    ],
  },
];

export default function Settings() {
  const [darkMode, setDarkMode] = useState(false);
  const [trackingEnabled, setTrackingEnabled] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="safe-top px-4 py-4 flex items-center justify-between border-b border-border/50">
        <Link to="/home">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="font-display font-bold text-lg">Settings</h1>
        <div className="w-10" />
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Profile Card */}
        <motion.div
          className="bg-gradient-to-br from-forest to-deep-forest rounded-2xl p-5 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold border-2 border-white/30">
              A
            </div>
            <div className="flex-1">
              <h2 className="font-display font-bold text-lg">Alex Johnson</h2>
              <p className="text-sm opacity-80">alex@example.com</p>
              <p className="text-xs opacity-60 mt-1">Member since Jan 2026</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Toggles */}
        <div className="bg-card rounded-2xl shadow-soft p-4 space-y-4">
          <ToggleSwitch
            checked={trackingEnabled}
            onChange={setTrackingEnabled}
            label="GPS Tracking"
            description="Automatically track your journeys"
          />
          <div className="border-t border-border/50" />
          <ToggleSwitch
            checked={darkMode}
            onChange={setDarkMode}
            label="Dark Mode"
            description="Easier on the eyes at night"
          />
        </div>

        {/* Settings Groups */}
        {settingsGroups.map((group, groupIndex) => (
          <motion.section
            key={group.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
          >
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
              {group.title}
            </h3>
            <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
              {group.items.map((item, index) => (
                <button
                  key={item.label}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-mint/20 transition-colors"
                  style={{
                    borderBottom: index < group.items.length - 1 ? "1px solid hsl(var(--border) / 0.5)" : "none"
                  }}
                >
                  <div className="w-9 h-9 rounded-full bg-mint/50 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-forest" />
                  </div>
                  <span className="flex-1 font-medium text-foreground">{item.label}</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              ))}
            </div>
          </motion.section>
        ))}

        {/* Logout Button */}
        <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10">
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>

        {/* App Info */}
        <div className="text-center space-y-1 py-4">
          <p className="text-xs text-muted-foreground">CalmTrip v1.0.0</p>
          <p className="text-xs text-muted-foreground">Made with 💚 for SDG 9</p>
        </div>
      </main>
    </div>
  );
}
