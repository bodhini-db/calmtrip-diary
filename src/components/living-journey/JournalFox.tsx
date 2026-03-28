import { motion } from "framer-motion";
import { useJournalFoxStage } from "@/hooks/useJournalFoxStage";
import { FoxEgg, FoxHatchling, FoxPup, FoxCub, FoxAdult, FoxElder } from "./FoxSVG";

interface JournalFoxProps {
  distanceKm: number;
  stopCount: number;
}

const StageSvg = ({ stage, nearEvolve }: { stage: number; nearEvolve: boolean }) => {
  if (stage === 1) return <FoxEgg size={130} nearEvolve={nearEvolve} />;
  if (stage === 2) return <FoxHatchling size={130} />;
  if (stage === 3) return <FoxPup size={130} />;
  if (stage === 4) return <FoxCub size={130} />;
  if (stage === 5) return <FoxAdult size={130} />;
  return <FoxElder size={130} />;
};

export function JournalFox({ distanceKm, stopCount }: JournalFoxProps) {
  const s = useJournalFoxStage(distanceKm, stopCount);
  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const bg = isDark
    ? "radial-gradient(circle at 30% 40%, #1C1410 0%, #292015 100%)"
    : "radial-gradient(circle at 30% 40%, #FFF7ED 0%, #FFEDD5 100%)";
  const nearEvolve = s.scoreToNext !== null && s.scoreToNext <= 1;
  const auraColor =
    s.stage <= 2 ? (isDark ? "#7C2D12" : "#FED7AA") : s.stage <= 4 ? (isDark ? "#9A3412" : "#FDBA74") : s.stage === 5 ? (isDark ? "#92400E" : "#FCD34D") : (isDark ? "#854D0E" : "#FDE68A");
  const overlayColor =
    s.stage <= 2 ? "rgba(255,255,255,0.7)" : s.stage <= 4 ? "rgba(255,247,237,0.7)" : s.stage === 5 ? "rgba(255,251,235,0.7)" : "rgba(254,252,232,0.7)";
  const pct = Math.max(0, Math.min(100, s.progressPercent));
  const dots = [1, 2, 3, 4, 5, 6];

  return (
    <div
      className="w-full rounded-2xl overflow-hidden relative p-3 md:p-5"
      style={{
        backgroundImage: bg,
        boxShadow: "0 4px 24px rgba(249,115,22,0.12)",
        borderLeft: "4px solid #F97316",
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.7, 0] }}
        transition={{ duration: 0.4, delay: 0.5 }}
        style={{ background: overlayColor, zIndex: 20 }}
      />
      <div className="flex flex-col md:flex-row items-center">
        <div className="relative w-full md:w-2/5 min-h-[140px] md:min-h-[150px] flex items-center justify-center">
          <motion.div
            className="absolute rounded-full w-20 h-20 md:w-28 md:h-28"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 1.2, 1], opacity: [0, 0.4, 0.4] }}
            transition={{ duration: 0.5, delay: 0.3 }}
            style={{
              background: auraColor,
              filter: "blur(30px)",
              opacity: 0.4,
              zIndex: 0,
            }}
          />
          <motion.div
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "backOut" as any }}
            className="relative z-10"
          >
            <div className="md:hidden w-[90px] h-[90px] flex items-center justify-center">
              <StageSvg stage={s.stage} nearEvolve={nearEvolve} />
            </div>
            <div className="hidden md:flex w-[130px] h-[130px] items-center justify-center">
              <StageSvg stage={s.stage} nearEvolve={nearEvolve} />
            </div>
          </motion.div>
        </div>
        <motion.div
          className="w-full md:w-3/5 p-3 md:p-4 text-center md:text-left"
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6, ease: "easeOut" }}
        >
          <div className="text-sm font-semibold text-foreground">🦊 Fox Companion</div>
          <div className="text-xs text-muted-foreground">Stage {s.stage} of 6</div>
          <div className="my-2" style={{ height: 1, background: "rgba(0,0,0,0.06)" }} />
          <div className="text-base md:text-lg font-bold text-foreground">{s.creatureName}</div>
          <div className="text-xs md:text-sm text-foreground">{Math.round(s.score)} pts</div>
          <div className="text-xs text-muted-foreground">({distanceKm.toFixed(1)}km + {stopCount} stops)</div>
          <div className="mt-2">
            <div className="w-full h-2 rounded-full" style={{ background: "rgba(249,115,22,0.2)" }}>
              <motion.div
                layoutId="fox-progress"
                className="h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%`, backgroundColor: "#F97316" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {s.stage < 6 ? `${s.scoreToNext ?? 0} pts to next evolution` : "✨ Elder Form — Maximum Level"}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-center md:justify-start gap-1 md:gap-1.5">
            {dots.map((d) => (
              <div key={d} className="w-2 h-2 rounded-full" style={{ background: d <= s.stage ? "#F97316" : "#e5e7eb" }} />
            ))}
          </div>
          <div className="mt-2 text-xs italic text-muted-foreground">{s.flavorText}</div>
        </motion.div>
      </div>
    </div>
  );
}
