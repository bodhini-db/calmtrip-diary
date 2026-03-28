import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion } from "framer-motion";
import { useAnimalStage } from "@/hooks/useAnimalStage";
import { EvolutionFlash } from "./EvolutionFlash";
import { StageProgressBar } from "./StageProgressBar";
import { FoxEgg, FoxHatchling, FoxPup, FoxCub, FoxAdult, FoxElder } from "./FoxSVG";

interface AnimalCompanionProps {
  journalCount: number;
}

const stageToSvg = (stage: number) => {
  if (stage === 1) return <FoxEgg />;
  if (stage === 2) return <FoxHatchling />;
  if (stage === 3) return <FoxPup />;
  if (stage === 4) return <FoxCub />;
  if (stage === 5) return <FoxAdult />;
  return <FoxElder />;
};

export function AnimalCompanion({ journalCount }: AnimalCompanionProps) {
  const info = useAnimalStage(journalCount);
  const dots = [1, 2, 3, 4, 5, 6];
  const label = info.nextAt ? "entries to next evolution" : "FINAL FORM";
  const color = "#f97316";
  return (
    <div className="relative">
      <EvolutionFlash show={info.changed} label="✨ Evolved!" />
      <Popover>
        <PopoverTrigger asChild>
          <motion.div
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="h-[140px] flex items-center justify-center">{stageToSvg(info.stage)}</div>
            <div className="text-center">
              <div className="font-semibold text-foreground">Fox • {info.name}</div>
              <div className="text-xs text-muted-foreground">Stage {info.stage} of 6</div>
            </div>
            <StageProgressBar
              value={journalCount}
              max={info.nextAt ? info.nextAt - 1 : null}
              color={color}
              label={`${Math.max(0, (info.nextAt || 0) - journalCount)} ${label}`}
              finalLabel="FINAL FORM"
            />
          </motion.div>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-2">
            <div className="font-medium text-foreground">Fox • {info.name}</div>
            <div className="text-sm text-muted-foreground">
              Stage {info.stage} of 6 • {journalCount} entries
            </div>
            <div className="flex items-center gap-1">
              {dots.map((d) => (
                <div
                  key={d}
                  className="w-2 h-2 rounded-full"
                  style={{ background: d <= info.stage ? color : "#e5e7eb" }}
                />
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
