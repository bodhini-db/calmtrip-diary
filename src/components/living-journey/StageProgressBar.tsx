import { motion } from "framer-motion";

interface StageProgressBarProps {
  value: number;
  max: number | null;
  color: string;
  label: string;
  finalLabel?: string;
}

export function StageProgressBar({ value, max, color, label, finalLabel }: StageProgressBarProps) {
  const pct = max ? Math.max(0, Math.min(100, (value / max) * 100)) : 100;
  const showFinal = !max;
  return (
    <div className="space-y-1">
      <div className="w-full h-2 rounded-full bg-muted" />
      <motion.div
        className="h-2 rounded-full -mt-2"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%`, backgroundColor: color }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {showFinal ? (finalLabel || "FINAL FORM") : label}
        </span>
        {!showFinal && (
          <span className="text-xs font-medium" style={{ color }}>
            {Math.max(0, Math.ceil(max! - value))}
          </span>
        )}
      </div>
    </div>
  );
}
