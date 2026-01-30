import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { MapPin, Shield, Pause, ChevronRight, ChevronLeft, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { signUp, signIn } from "@/lib/supabase";
import paperAirplane from "@/assets/paper-airplane.png";

const slides = [
  {
    id: 1,
    title: "Relive every journey, effortlessly.",
    description: "Your personal travel diary tracks your adventures in the background while keeping your data 100% private.",
    showToggles: false,
  },
  {
    id: 2,
    title: "Smart & Mindful Tracking",
    description: "CalmTrip uses battery-optimized GPS to capture your journeys without draining your phone.",
    showToggles: false,
  },
  {
    id: 3,
    title: "Your Privacy Matters",
    description: "We believe your travel memories are personal. Choose what to share and what to keep private.",
    showToggles: true,
  },
];

const features = [
  {
    icon: MapPin,
    title: "Smart Tracking",
    description: "Battery-optimized GPS recording.",
  },
  {
    icon: Shield,
    title: "Private by Design",
    description: "Data stays on your device.",
  },
  {
    icon: Pause,
    title: "Full Control",
    description: "Pause or stop tracking anytime.",
  },
];

export default function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [consents, setConsents] = useState({
    gpsTracking: true,
    photoGeotagging: true,
    anonymousResearch: false,
  });
  const [showAuth, setShowAuth] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (user && !loading) {
      navigate("/home");
    }
  }, [user, loading, navigate]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // Move to auth after consents
      setShowAuth(true);
    }
  };

  const handleBack = () => {
    if (showAuth) {
      setShowAuth(false);
    } else if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) throw error;
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
      // Navigate will happen automatically when user state updates
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-mint/30 via-background to-background flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="text-6xl mb-4"
          >
            🧳
          </motion.div>
          <p className="text-muted-foreground">Loading CalmTrip...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-mint/30 via-background to-background flex flex-col">
      {/* Header */}
      <div className="safe-top flex items-center justify-between px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">
          {showAuth ? "Create Account" : "Privacy First"}
        </span>
        <Shield className="w-5 h-5 text-forest" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-6">
        <AnimatePresence mode="wait">
          {!showAuth ? (
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            {/* Illustration */}
            <div className="flex-1 flex items-center justify-center py-8">
              <motion.img
                src={paperAirplane}
                alt="Paper airplane"
                className="w-48 h-48 object-contain animate-float"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
            </div>

            {/* Text Content */}
            <div className="space-y-4 text-center mb-6">
              <motion.h1
                className="text-2xl font-bold font-display text-foreground"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {slides[currentSlide].title}
              </motion.h1>
              <motion.p
                className="text-muted-foreground leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {slides[currentSlide].description}
              </motion.p>
            </div>

            {/* Features or Toggles */}
            {!slides[currentSlide].showToggles ? (
              <motion.div
                className="space-y-3 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {features.map((feature, index) => (
                  <div
                    key={feature.title}
                    className="flex items-center gap-4 bg-card rounded-xl p-4 shadow-soft"
                  >
                    <div className="w-10 h-10 rounded-full bg-mint flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-forest" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-forest/10 flex items-center justify-center">
                      <span className="text-forest text-xs">✓</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                className="space-y-4 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="bg-card rounded-xl p-4 shadow-soft">
                  <ToggleSwitch
                    checked={consents.gpsTracking}
                    onChange={(checked) => setConsents({ ...consents, gpsTracking: checked })}
                    label="GPS Trip Tracking"
                    description="Record your journeys automatically"
                  />
                </div>
                <div className="bg-card rounded-xl p-4 shadow-soft">
                  <ToggleSwitch
                    checked={consents.photoGeotagging}
                    onChange={(checked) => setConsents({ ...consents, photoGeotagging: checked })}
                    label="Photo Geotagging"
                    description="Add location data to your photos"
                  />
                </div>
                <div className="bg-card rounded-xl p-4 shadow-soft">
                  <ToggleSwitch
                    checked={consents.anonymousResearch}
                    onChange={(checked) => setConsents({ ...consents, anonymousResearch: checked })}
                    label="Anonymous Research"
                    description="Help improve urban planning (SDG 9)"
                  />
                </div>
              </motion.div>
            )}
          </motion.div>
          ) : (
            <motion.div
              key="auth"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col justify-center"
            >
              <div className="text-center mb-8">
                <motion.h1
                  className="text-2xl font-bold font-display text-foreground mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {isSignUp ? "Create Account" : "Welcome Back"}
                </motion.h1>
                <p className="text-muted-foreground">
                  {isSignUp
                    ? "Join CalmTrip to track your journeys"
                    : "Sign in to your account"}
                </p>
              </div>

              {authError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-600">{authError}</p>
                </motion.div>
              )}

              <form onSubmit={handleAuth} className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest bg-background"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest bg-background"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={authLoading}
                  variant="calm"
                  className="w-full"
                  size="lg"
                >
                  {authLoading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
                </Button>
              </form>

              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-center text-sm text-forest underline mb-8"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Create one"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="pb-8 space-y-4">
          {/* Dots - only show on slides */}
          {!showAuth && (
            <div className="flex justify-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? "w-8 bg-forest"
                      : "bg-sage/50"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            {(showAuth || currentSlide > 0) && (
              <Button
                variant="outline"
                size="icon-lg"
                onClick={handleBack}
                className="shrink-0"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            <Button
              variant="calm"
              size="lg"
              className="flex-1"
              onClick={!showAuth ? handleNext : undefined}
              disabled={showAuth}
            >
              {!showAuth
                ? currentSlide === slides.length - 1
                  ? "Allow & Continue"
                  : "Continue"
                : ""}
              {!showAuth && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>

          {/* Footer */}
          {!showAuth && (
            <p className="text-center text-xs text-muted-foreground">
              By continuing, you agree to our{" "}
              <a href="#" className="text-forest underline">Privacy Policy</a>
              {" "}and{" "}
              <a href="#" className="text-forest underline">Terms of Service</a>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
