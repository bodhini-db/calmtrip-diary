import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, MapPin, Clock, ChevronRight, Loader2, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { planTrip, geocodeCheckpoints, AiTripPlan } from "@/lib/gemini";

interface AiTripPlannerProps {
  pastTripSummary: string;
}

const DURATIONS = [
  { label: "30 min", value: 30 },
  { label: "1 hr", value: 60 },
  { label: "2 hr", value: 120 },
  { label: "Half day", value: 240 },
];

type Step = "idle" | "planning" | "geocoding" | "done" | "error";

export function AiTripPlanner({ pastTripSummary }: AiTripPlannerProps) {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(60);
  const [step, setStep] = useState<Step>("idle");
  const [plan, setPlan] = useState<AiTripPlan | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setStep("planning");
    setErrorMsg("");
    setPlan(null);

    try {
      const raw = await planTrip(prompt, duration, pastTripSummary);
      setStep("geocoding");
      const geocoded = await geocodeCheckpoints(raw.checkpoints, raw.city);
      setPlan({ ...raw, checkpoints: geocoded });
      setStep("done");
    } catch (err) {
      console.error(err);
      setErrorMsg("Couldn't generate a plan. Check your Gemini API key or try again.");
      setStep("error");
    }
  };

  const handleSimulate = () => {
    if (!plan) return;
    const simulatable = plan.checkpoints.filter(cp => cp.lat && cp.lng);
    navigate("/map", {
      state: {
        aiPlan: {
          title: plan.title,
          checkpoints: simulatable.map(cp => ({
            name: cp.name,
            description: cp.description,
            lat: cp.lat!,
            lng: cp.lng!,
          })),
        },
      },
    });
  };

  const mappedCount = plan ? plan.checkpoints.filter(c => c.lat).length : 0;
  const canSimulate = mappedCount >= 2;

  return (
    <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl p-4 border border-violet-100 shadow-soft">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-display font-bold text-foreground text-sm">AI Trip Planner</h3>
          <p className="text-[10px] text-muted-foreground">Powered by Gemini</p>
        </div>
      </div>

      {/* Prompt input */}
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder='e.g. "A coffee walk around Indiranagar" or "Historical spots in Old Delhi"'
        rows={2}
        className="w-full rounded-xl border border-violet-200 bg-white/80 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-muted-foreground/60"
      />

      {/* Duration selector */}
      <div className="flex gap-2 mt-2 mb-3">
        {DURATIONS.map(d => (
          <button
            key={d.value}
            onClick={() => setDuration(d.value)}
            className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-all ${
              duration === d.value
                ? "bg-violet-500 text-white shadow-sm"
                : "bg-white/80 text-muted-foreground hover:bg-white border border-violet-100"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Generate button */}
      <Button
        variant="calm"
        className="w-full bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white border-0"
        onClick={handleGenerate}
        disabled={!prompt.trim() || step === "planning" || step === "geocoding"}
      >
        {step === "planning" && <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Planning your trip...</>}
        {step === "geocoding" && <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Finding locations...</>}
        {(step === "idle" || step === "done" || step === "error") && (
          <><Sparkles className="w-4 h-4 mr-2" />Generate Plan</>
        )}
      </Button>

      {/* Error */}
      {step === "error" && (
        <p className="text-xs text-red-500 mt-2 text-center">{errorMsg}</p>
      )}

      {/* Results */}
      <AnimatePresence>
        {step === "done" && plan && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 space-y-3"
          >
            {/* Trip title */}
            <div className="bg-white/90 rounded-xl p-3 border border-violet-100">
              <h4 className="font-display font-bold text-foreground text-sm">{plan.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{plan.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {plan.estimated_duration_minutes} min
                </span>
                <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {plan.checkpoints.length} stops
                </span>
                {plan.checkpoints.some(c => !c.lat) && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    Some locations not mapped
                  </span>
                )}
              </div>
            </div>

            {/* Checkpoints timeline */}
            <div className="relative pl-4">
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-violet-400 to-indigo-200" />
              {plan.checkpoints.map((cp, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="relative pl-5 pb-3 last:pb-0"
                >
                  <div className={`absolute left-0 top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm z-10 ${cp.lat ? "bg-violet-500" : "bg-gray-300"}`} />
                  <div className="bg-white/80 rounded-xl p-2.5 border border-violet-100">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-xs leading-tight">{cp.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{cp.description}</p>
                      </div>
                      <span className="text-[10px] text-violet-600 font-medium shrink-0 mt-0.5">
                        {cp.suggested_duration_minutes}m
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            {!canSimulate && plan && (
              <p className="text-[10px] text-amber-600 text-center px-2">
                {mappedCount === 0
                  ? "Couldn't map locations — geocoding failed. Try a more specific place name or city."
                  : `Only ${mappedCount} location${mappedCount === 1 ? "" : "s"} mapped. Need at least 2 to simulate.`}
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <Button
                variant="calm"
                size="sm"
                className="flex-1 bg-gradient-to-r from-violet-500 to-indigo-500 text-white border-0 text-xs"
                onClick={handleSimulate}
                disabled={!canSimulate}
                title={!canSimulate ? "Need at least 2 mapped locations to simulate" : ""}
              >
                <Navigation className="w-3.5 h-3.5 mr-1.5" />
                Simulate Trip
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs border-violet-200 text-violet-700"
                onClick={() => {
                  const text = [
                    plan.title,
                    plan.description,
                    "",
                    ...plan.checkpoints.map((cp, i) => `${i + 1}. ${cp.name} (${cp.suggested_duration_minutes}min)\n   ${cp.description}`),
                  ].join("\n");
                  navigator.clipboard.writeText(text);
                }}
              >
                Copy
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
