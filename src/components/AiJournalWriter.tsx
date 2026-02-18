import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateJournalEntry } from "@/lib/gemini";

interface AiJournalWriterProps {
  trip: {
    origin?: string;
    destination?: string;
    distance_km?: number;
    duration_minutes?: number;
    created_at: string;
    _checkpoints?: Array<{ name: string; photos?: any[] }>;
  };
}

export function AiJournalWriter({ trip }: AiJournalWriterProps) {
  const [entry, setEntry] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setEntry("");

    try {
      const checkpoints = (trip._checkpoints || []).map(cp => ({
        name: cp.name,
        photoCount: cp.photos?.length || 0,
      }));

      const text = await generateJournalEntry({
        origin: trip.origin || "Start",
        destination: trip.destination || "Destination",
        distance_km: trip.distance_km || 0,
        duration_minutes: trip.duration_minutes || 0,
        checkpoints,
        date: new Date(trip.created_at).toLocaleDateString("en-IN", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
        }),
      });
      setEntry(text);
    } catch (err) {
      console.error(err);
      setError("Couldn't write the entry. Check your Gemini API key.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(entry);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-4 mx-4">
      {!entry && !loading && (
        <Button
          variant="outline"
          className="w-full border-violet-200 text-violet-700 hover:bg-violet-50 gap-2"
          onClick={handleGenerate}
        >
          <Sparkles className="w-4 h-4" />
          Write Journal Entry with AI
        </Button>
      )}

      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2 py-4 text-violet-600"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          <p className="text-sm font-medium">Writing your diary entry...</p>
        </motion.div>
      )}

      {error && (
        <p className="text-xs text-red-500 text-center py-2">{error}</p>
      )}

      <AnimatePresence>
        {entry && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl p-4 border border-violet-100"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                <span className="text-xs font-semibold text-violet-700">AI Journal Entry</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 text-violet-600 hover:bg-violet-100"
                onClick={handleCopy}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-serif">
              {entry}
            </p>
            <button
              onClick={handleGenerate}
              className="mt-3 text-xs text-violet-500 underline"
            >
              Regenerate
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
