import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MapPin, X, Loader2, Coffee, TreePine, Landmark, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchNearbyPlaces, discoverNearby, NearbyPlace } from "@/lib/gemini";
import { PresetLocation } from "@/hooks/useTripSimulator";

interface AiNearbyPlacesProps {
  currentLocation: [number, number] | null;
  onAddToRoute: (place: PresetLocation) => void;
}

const CATEGORY_ICONS: Record<string, typeof Coffee> = {
  cafe: Coffee,
  restaurant: UtensilsCrossed,
  park: TreePine,
  garden: TreePine,
  attraction: Landmark,
  museum: Landmark,
  viewpoint: Landmark,
  historic: Landmark,
};

function CategoryIcon({ type }: { type: string }) {
  const Icon = CATEGORY_ICONS[type] || MapPin;
  return <Icon className="w-3.5 h-3.5" />;
}

type Step = "idle" | "fetching" | "ranking" | "done" | "error";

export function AiNearbyPlaces({ currentLocation, onAddToRoute }: AiNearbyPlacesProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  const handleDiscover = async () => {
    if (!currentLocation) return;
    setOpen(true);
    setStep("fetching");
    setError("");
    setPlaces([]);
    setAdded(new Set());

    try {
      const raw = await fetchNearbyPlaces(currentLocation[0], currentLocation[1]);
      if (raw.length === 0) {
        setError("No named places found within 600m. Try moving to a busier area.");
        setStep("error");
        return;
      }
      setStep("ranking");
      const curated = await discoverNearby(raw);
      setPlaces(curated);
      setStep("done");
    } catch (err) {
      console.error(err);
      setError("Couldn't load nearby places. Check connection or API key.");
      setStep("error");
    }
  };

  const handleAdd = (place: NearbyPlace) => {
    onAddToRoute({
      name: place.name,
      description: place.description,
      lat: place.lat,
      lng: place.lng,
    });
    setAdded(prev => new Set([...prev, place.name]));
  };

  return (
    <>
      {/* Trigger button — shown in MapView bottom controls */}
      <Button
        variant="outline"
        size="sm"
        className="bg-white/90 backdrop-blur-xl border-violet-200 text-violet-700 text-xs shadow-sm rounded-xl gap-1.5"
        onClick={handleDiscover}
        disabled={!currentLocation}
      >
        <Sparkles className="w-3.5 h-3.5" />
        Nearby
      </Button>

      {/* Bottom sheet */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-[1100]"
              onClick={() => setOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[1200] bg-white rounded-t-3xl shadow-2xl max-h-[70vh] flex flex-col"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-foreground text-sm">Discover Nearby</h3>
                    <p className="text-[10px] text-muted-foreground">AI-curated places around you</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {(step === "fetching" || step === "ranking") && (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                    <p className="text-sm text-muted-foreground">
                      {step === "fetching" ? "Scanning nearby places..." : "AI is ranking the best spots..."}
                    </p>
                  </div>
                )}

                {step === "error" && (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={handleDiscover}>
                      Try Again
                    </Button>
                  </div>
                )}

                {step === "done" && places.map((place, i) => (
                  <motion.div
                    key={place.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-start gap-3 bg-gray-50 rounded-2xl p-3"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-violet-600 shrink-0 mt-0.5">
                      <CategoryIcon type={place.category} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-foreground text-sm leading-tight">{place.name}</span>
                        <span className="text-[10px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full font-medium capitalize">
                          {place.category}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {place.distance_m < 1000 ? `${place.distance_m}m` : `${(place.distance_m / 1000).toFixed(1)}km`}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{place.description}</p>
                    </div>
                    <Button
                      variant={added.has(place.name) ? "outline" : "calm"}
                      size="sm"
                      className={`shrink-0 text-xs h-8 px-3 ${added.has(place.name) ? "border-violet-200 text-violet-600" : "bg-violet-500 hover:bg-violet-600 text-white border-0"}`}
                      onClick={() => handleAdd(place)}
                      disabled={added.has(place.name)}
                    >
                      {added.has(place.name) ? "Added" : "+ Plan"}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
