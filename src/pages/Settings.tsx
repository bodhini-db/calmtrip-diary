import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FloatingCard } from "@/components/ui/floating-card";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { User, MapPin, Bell, Shield, HelpCircle, LogOut, Lock, MessageSquare, Bug, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { signOut, supabase } from "@/lib/supabase";
import { getPrivacySettings, updatePrivacySettings } from "@/lib/api";

const Settings = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [privacySettings, setPrivacySettings] = useState<any>(null);
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [photosEnabled, setPhotosEnabled] = useState(true);

  // Dialog states
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [bugDialogOpen, setBugDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully!");
      setPasswordDialogOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password. Please try again.");
    }
  };

  const handleCopyBugTemplate = async () => {
    const template = [
      "Bug Report - CalmTrip",
      "=====================",
      "",
      "What happened:",
      "[Describe the issue]",
      "",
      "Steps to reproduce:",
      "1. ",
      "2. ",
      "3. ",
      "",
      "Expected behavior:",
      "[What you expected to happen]",
      "",
      `Device: ${navigator.userAgent}`,
      `Date: ${new Date().toLocaleDateString()}`,
    ].join("\n");

    await navigator.clipboard.writeText(template);
    toast.success("Bug report template copied to clipboard!");
    setBugDialogOpen(false);
  };

  const handleCopyFeedback = async () => {
    const template = [
      "Feedback - CalmTrip",
      "====================",
      "",
      "What I love:",
      "[Share what you enjoy]",
      "",
      "What could be better:",
      "[Share your suggestions]",
      "",
      "Feature request:",
      "[Any features you'd like to see]",
      "",
      `Date: ${new Date().toLocaleDateString()}`,
    ].join("\n");

    await navigator.clipboard.writeText(template);
    toast.success("Feedback template copied to clipboard!");
    setFeedbackDialogOpen(false);
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
                onClick={() => setPrivacyDialogOpen(true)}
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
          <FloatingCard className="space-y-0 divide-y divide-border/50">
            <button
              onClick={() => setHelpDialogOpen(true)}
              className="w-full flex items-center justify-between p-3 hover:bg-muted/50 rounded-t-lg transition"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-foreground">Help Center</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => setBugDialogOpen(true)}
              className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition"
            >
              <div className="flex items-center gap-3">
                <Bug className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-foreground">Report a Bug</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => setFeedbackDialogOpen(true)}
              className="w-full flex items-center justify-between p-3 hover:bg-muted/50 rounded-b-lg transition"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-foreground">Send Feedback</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
              onClick={() => setPasswordDialogOpen(true)}
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

      {/* Privacy Policy Dialog */}
      <Dialog open={privacyDialogOpen} onOpenChange={setPrivacyDialogOpen}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Privacy Policy</DialogTitle>
            <DialogDescription>Last updated: February 2026</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground mb-1">Data Collection</h3>
              <p>CalmTrip collects location data, photos, and travel metadata only when you actively use the app. We never collect data in the background without your consent.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Data Storage</h3>
              <p>Your data is stored securely on Supabase servers with encryption at rest and in transit. Trip data can also be stored locally on your device for offline access.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Data Sharing</h3>
              <p>We never sell your personal data. If you opt-in to anonymized data sharing, only aggregated, non-identifiable travel patterns are used for urban planning research (SDG 9).</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Your Rights</h3>
              <ul className="list-disc pl-4 space-y-1">
                <li>Export all your data at any time (JSON or CSV)</li>
                <li>Delete your account and all associated data</li>
                <li>Toggle GPS tracking and photo geotagging on/off</li>
                <li>Opt out of anonymized data sharing at any time</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Third-Party Services</h3>
              <p>CalmTrip uses Supabase for authentication and storage, and map tile providers for map rendering. No third-party analytics or advertising SDKs are used.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help Center Dialog */}
      <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Help Center</DialogTitle>
            <DialogDescription>Frequently asked questions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {[
              {
                q: "How do I start tracking a trip?",
                a: "Go to the Map tab and tap 'Start Trip'. CalmTrip will automatically track your movement using GPS.",
              },
              {
                q: "How do I add photos to a trip?",
                a: "During an active trip, tap the checkpoint button to create a stop. You can capture or upload photos at each checkpoint.",
              },
              {
                q: "Can I use CalmTrip offline?",
                a: "Yes! Trips are saved locally on your device. They'll sync to the cloud when you're back online.",
              },
              {
                q: "How do I export my data?",
                a: "Go to the Stats tab, scroll to 'Privacy & Research', and tap 'Export Data'. You can choose JSON or CSV format.",
              },
              {
                q: "Is my location data private?",
                a: "Absolutely. Your data is encrypted and never shared unless you explicitly opt-in to anonymized sharing for research purposes.",
              },
            ].map((faq, i) => (
              <div key={i} className="border-b border-border/50 pb-3 last:border-0">
                <h3 className="font-semibold text-foreground text-sm mb-1">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Bug Dialog */}
      <Dialog open={bugDialogOpen} onOpenChange={setBugDialogOpen}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Report a Bug</DialogTitle>
            <DialogDescription>Help us improve CalmTrip by reporting issues</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Copy a bug report template to your clipboard, fill it out, and send it to us via email or your preferred channel.
            </p>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs font-mono text-muted-foreground whitespace-pre-line">
                {`Bug Report - CalmTrip\n\nWhat happened:\n[Describe the issue]\n\nSteps to reproduce:\n1. ...\n2. ...\n\nExpected behavior:\n[What you expected]`}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="calm" onClick={handleCopyBugTemplate} className="w-full">
              <Bug className="w-4 h-4" />
              Copy Bug Report Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
            <DialogDescription>We'd love to hear from you</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Copy a feedback template to your clipboard, fill it out, and share your thoughts with us.
            </p>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs font-mono text-muted-foreground whitespace-pre-line">
                {`Feedback - CalmTrip\n\nWhat I love:\n[Share what you enjoy]\n\nWhat could be better:\n[Your suggestions]\n\nFeature request:\n[Features you'd like]`}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="calm" onClick={handleCopyFeedback} className="w-full">
              <MessageSquare className="w-4 h-4" />
              Copy Feedback Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter your new password below</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">New Password</label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Confirm Password</label>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="calm" onClick={handleChangePassword}>
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
