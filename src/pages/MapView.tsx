import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Navigation2, Layers, Plus, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

// Note: Mapbox requires an access token. Users need to add their own token.
const MAPBOX_PLACEHOLDER = "YOUR_MAPBOX_ACCESS_TOKEN";

export default function MapView() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [showTokenWarning, setShowTokenWarning] = useState(true);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Map Container */}
      <div 
        ref={mapContainerRef} 
        className="absolute inset-0 bg-gradient-to-br from-mint via-sage/30 to-cream"
      >
        {/* Placeholder Map Background */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            {showTokenWarning && (
              <motion.div
                className="bg-card rounded-2xl p-6 shadow-float mx-4 max-w-sm"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-mint flex items-center justify-center">
                  <Navigation2 className="w-8 h-8 text-forest" />
                </div>
                <h3 className="font-display font-bold text-lg text-foreground mb-2">
                  Map Ready
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your Mapbox account to see live maps with your trip routes and photo markers.
                </p>
                <Button variant="calm" className="w-full" onClick={() => setShowTokenWarning(false)}>
                  Continue with Preview
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Simulated Route Line */}
        {!showTokenWarning && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <motion.path
              d="M 50 400 Q 150 350 200 300 T 350 250"
              fill="none"
              stroke="hsl(152, 35%, 45%)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="0 1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
              style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
            />
          </svg>
        )}

        {/* Floating Photo Markers */}
        {!showTokenWarning && (
          <>
            <motion.div
              className="absolute top-1/3 left-1/4 w-12 h-12 rounded-full bg-forest border-3 border-white shadow-float cursor-pointer animate-float"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.2 }}
            >
              <div className="w-full h-full rounded-full bg-gradient-to-br from-forest to-sage flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </motion.div>
            <motion.div
              className="absolute top-1/2 right-1/3 w-10 h-10 rounded-full bg-olive border-3 border-white shadow-float cursor-pointer"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.2 }}
              style={{ animationDelay: "1s" }}
            >
              <div className="w-full h-full rounded-full bg-gradient-to-br from-olive to-sage flex items-center justify-center">
                <span className="text-xs">📸</span>
              </div>
            </motion.div>
          </>
        )}
      </div>

      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 safe-top px-4 py-3 flex items-center justify-between z-10">
        <Link to="/home">
          <Button variant="float" size="icon">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="font-display font-bold text-foreground bg-card/80 backdrop-blur px-4 py-2 rounded-full shadow-soft">
          Today's Route
        </h1>
        <Button variant="float" size="icon">
          <Layers className="w-5 h-5" />
        </Button>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 z-10">
        {/* Trip Info Card */}
        {!showTokenWarning && (
          <motion.div
            className="bg-card rounded-2xl p-4 shadow-float mb-4"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Current Trip</p>
                <h3 className="font-display font-bold text-foreground">Marina District Walk</h3>
              </div>
              <div className="flex items-center gap-2 text-forest">
                <span className="w-2 h-2 bg-forest rounded-full animate-pulse" />
                <span className="text-sm font-medium">Tracking</span>
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Distance</p>
                <p className="font-semibold text-foreground">2.4 km</p>
              </div>
              <div>
                <p className="text-muted-foreground">Duration</p>
                <p className="font-semibold text-foreground">45 min</p>
              </div>
              <div>
                <p className="text-muted-foreground">Photos</p>
                <p className="font-semibold text-foreground">3</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="float" size="icon-lg" className="shrink-0">
            <Navigation2 className="w-5 h-5 text-forest" />
          </Button>
          <Button variant="calm" className="flex-1" size="lg">
            <Camera className="w-5 h-5" />
            Add Photo
          </Button>
          <Button variant="float" size="icon-lg" className="shrink-0">
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
