import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion } from "framer-motion";
import { useTreeStage } from "@/hooks/useTreeStage";
import { EvolutionFlash } from "./EvolutionFlash";
import { StageProgressBar } from "./StageProgressBar";
import { TreeSeed, TreeSprout, TreeSapling, TreeYoung, TreeFull, TreeAncient } from "./TreeSVG";

interface TreeCompanionProps {
  totalKm: number;
}

const stageToSvg = (stage: number) => {
  if (stage === 1) return <TreeSeed />;
  if (stage === 2) return <TreeSprout />;
  if (stage === 3) return <TreeSapling />;
  if (stage === 4) return <TreeYoung />;
  if (stage === 5) return <TreeFull />;
  return <TreeAncient />;
};

export function TreeCompanion({ totalKm }: TreeCompanionProps) {
  const info = useTreeStage(totalKm);
  const dots = [1, 2, 3, 4, 5, 6];
  const label = info.nextAt ? "km to next growth" : "FINAL FORM";
  const color = "#16a34a";
  return (
    <div className="relative">
      <EvolutionFlash show={info.changed} label="🌿 Grew!" />
      <Popover>
        <PopoverTrigger asChild>
          <motion.div
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="h-[140px] flex items-center justify-center">{stageToSvg(info.stage)}</div>
            <div className="text-center">
              <div className="font-semibold text-foreground">Tree • {info.name}</div>
              <div className="text-xs text-muted-foreground">Stage {info.stage} of 6</div>
            </div>
            <StageProgressBar
              value={totalKm}
              max={info.nextAt ? info.nextAt - 1 : null}
              color={color}
              label={`${Math.max(0, (info.nextAt || 0) - totalKm)} ${label}`}
              finalLabel="FINAL FORM"
            />
          </motion.div>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-2">
            <div className="font-medium text-foreground">Tree • {info.name}</div>
            <div className="text-sm text-muted-foreground">
              Stage {info.stage} of 6 • {totalKm.toFixed(1)}km
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
