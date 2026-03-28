import { motion } from "framer-motion";
import { AnimalCompanion } from "./AnimalCompanion";
import { TreeCompanion } from "./TreeCompanion";
import { FloatingCard } from "@/components/ui/floating-card";

interface LivingJourneyCardProps {
  journalCount: number;
  totalKm: number;
  loading?: boolean;
}

export function LivingJourneyCard({ journalCount, totalKm, loading }: LivingJourneyCardProps) {
  return (
    <FloatingCard className="p-4">
      <div className="mb-3">
        <div className="font-display font-semibold text-foreground">Living Journey</div>
        <div className="text-xs text-muted-foreground">
          Companions grow with your diary entries and distance
        </div>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-muted/20 h-44 animate-pulse" />
          <div className="rounded-xl border border-border bg-muted/20 h-44 animate-pulse" />
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AnimalCompanion journalCount={journalCount} />
          <TreeCompanion totalKm={totalKm} />
        </motion.div>
      )}
    </FloatingCard>
  );
}
