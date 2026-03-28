import { useRef } from "react";
import { motion } from "framer-motion";
import { FloatingCard } from "@/components/ui/floating-card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTreeStage } from "@/hooks/useTreeStage";
import { EvolutionFlash } from "./EvolutionFlash";
import { StageProgressBar } from "./StageProgressBar";
import { TreeSeed, TreeSprout, TreeSapling, TreeYoung, TreeFull, TreeAncient } from "./TreeSVG";

interface TreeOnlyCardProps {
  totalKm: number;
}

const StageSvg = ({ stage }: { stage: number }) => {
  if (stage === 1) return <TreeSeed />;
  if (stage === 2) return <TreeSprout />;
  if (stage === 3) return <TreeSapling />;
  if (stage === 4) return <TreeYoung />;
  if (stage === 5) return <TreeFull />;
  return <TreeAncient />;
};

export function TreeOnlyCard({ totalKm }: TreeOnlyCardProps) {
  const info = useTreeStage(totalKm);
  const prevStageRef = useRef<number | null>(null);
  const changed = prevStageRef.current !== null && prevStageRef.current !== info.stage;
  prevStageRef.current = info.stage;
  const color = "#16a34a";
  const nextAt = info.nextAt ? info.nextAt - 1 : null;
  const dots = [1, 2, 3, 4, 5, 6];
  return (
    <FloatingCard className="p-4">
      <div className="mb-3">
        <div className="font-display font-semibold text-foreground">Journey Tree</div>
        <div className="text-xs text-muted-foreground">Grows with every km you explore</div>
      </div>
      <div className="relative">
        <EvolutionFlash show={changed} label="🌿 Grew!" />
        <Popover>
          <PopoverTrigger asChild>
            <motion.div
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="h-[160px] flex items-center justify-center">
                <StageSvg stage={info.stage} />
              </div>
              <div className="text-center">
                <div className="font-semibold text-foreground">Tree • {info.name}</div>
                <div className="text-xs text-muted-foreground">Stage {info.stage} of 6</div>
              </div>
              <StageProgressBar
                value={totalKm}
                max={nextAt ?? null}
                color={color}
                label={`${info.nextAt ? Math.max(0, (info.nextAt || 0) - totalKm).toFixed(1) : 0}km to next growth`}
                finalLabel="FINAL FORM"
              />
            </motion.div>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-2">
              <div className="font-medium text-foreground">🌳 {info.name}</div>
              <div className="text-sm text-muted-foreground">
                Stage {info.stage} of 6 • {totalKm.toFixed(1)} km total
              </div>
              <div className="text-sm text-muted-foreground">
                {info.nextAt ? `${Math.max(0, (info.nextAt || 0) - totalKm).toFixed(1)} km to next growth` : "FINAL FORM"}
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
    </FloatingCard>
  );
}
