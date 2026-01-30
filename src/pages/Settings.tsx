import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FloatingCard } from "@/components/ui/floating-card";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { User, MapPin, Bell, Shield, HelpCircle, LogOut, Lock } from "lucide-react";
import { signOut } from "@/lib/supabase";
import { getPrivacySettings, updatePrivacySettings } from "@/lib/api";

const Settings = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [privacySettings, setPrivacySettings] = useState<any>(null);
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [photosEnabled, setPhotosEnabled] = useState(true);

  useEffect(() => {
    if (!user && !loading) {
      navigate("/");
      return;
    }

    if (user) {
      loadSettings();
    }
  }, [user, loading, navigate]);

  const loadSettings = async () => {
    if (!user) return;
    try {
      const settings = await getPrivacySettings(user.id);
      setPrivacySettings(settings);
      setGpsEnabled(settings?.gps_tracking_enabled ?? true);
      setPhotosEnabled(settings?.photo_geotagging_enabled ?? true);
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const handleGpsToggle = async (checked: boolean) => {
    setGpsEnabled(checked);
    if (user && privacySettings) {
      try {
        await updatePrivacySettings(user.id, {
          ...privacySettings,
          gps_tracking_enabled: checked,
        });
      } catch (error) {
        console.error("Error updating GPS setting:", error);
      }
    }
  };

  const handlePhotosToggle = async (checked: boolean) => {
    setPhotosEnabled(checked);
    if (user && privacySettings) {
      try {
        await updatePrivacySettings(user.id, {
          ...privacySettings,
          photo_geotagging_enabled: checked,
        });
      } catch (error) {
        console.error("Error updating photo setting:", error);
      }
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
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="safe-top px-4 py-6">
        <h1 className="font-display font-bold text-2xl text-foreground mb-1">Settings</h1>
        <p className="text-muted-foreground">Manage your account & preferences</p>
      </header>

      <main className="px-4 space-y-6">
        {/* Profile Card */}
        {user && (
          <FloatingCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-forest to-sage flex items-center justify-center text-white font-bold text-lg">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-foreground">{user.email}</h2>
                <p className="text-sm text-muted-foreground">Account holder</p>
              </div>
            </div>
          </FloatingCard>
        )}

        {/* Tracking Settings */}
        <section>
          <h2 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Tracking & Location
          </h2>
          <FloatingCard className="space-y-4">
            <div className="border-b border-border/50 pb-4">
              <ToggleSwitch
                checked={gpsEnabled}
                onChange={handleGpsToggle}
                label="GPS Tracking"
                description="Track your journeys automatically"
              />
            </div>
            <div>
              <ToggleSwitch
                checked={photosEnabled}
                onChange={handlePhotosToggle}
                label="Geotagged Photos"
                description="Add location data to photos"
              />
            </div>
          </FloatingCard>
        </section>

        {/* Privacy & Consent */}
        <section>
          <h2 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Privacy & Data
          </h2>
          <FloatingCard className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium text-foreground">Your Data Rights</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ All data is encrypted in transit and at rest</li>
                <li>✓ No third-party tracking or ads</li>
                <li>✓ You can export or delete your data anytime</li>
                <li>✓ We never sell your information</li>
              </ul>
            </div>

            <div className="border-t border-border/50 pt-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Lock className="w-4 h-4" />
                View Privacy Policy
              </Button>
            </div>
          </FloatingCard>
        </section>

        {/* Support */}
        <section>
          <h2 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Support
          </h2>
          <FloatingCard className="space-y-2">
            <button className="w-full flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition">
              <span className="text-sm font-medium text-foreground">Help Center</span>
              <span className="text-muted-foreground">→</span>
            </button>
            <button className="w-full flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition">
              <span className="text-sm font-medium text-foreground">Report a Bug</span>
              <span className="text-muted-foreground">→</span>
            </button>
            <button className="w-full flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition">
              <span className="text-sm font-medium text-foreground">Send Feedback</span>
              <span className="text-muted-foreground">→</span>
            </button>
          </FloatingCard>
        </section>

        {/* Account Actions */}
        <section>
          <h2 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            Account
          </h2>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
            >
              <Lock className="w-4 h-4" />
              Change Password
            </Button>
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </section>

        {/* App Info */}
        <FloatingCard className="text-center py-6">
          <p className="text-xs text-muted-foreground mb-2">
            CalmTrip v1.0
          </p>
          <p className="text-xs text-muted-foreground">
            Built with care for mindful travelers 💚
          </p>
        </FloatingCard>
      </main>
    </div>
  );
};

export default Settings;
