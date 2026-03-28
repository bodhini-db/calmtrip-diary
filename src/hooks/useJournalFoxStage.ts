import { useMemo } from "react";

export type JournalFoxStage = {
  stage: number;
  creatureName: string;
  flavorText: string;
  progressPercent: number;
  scoreIntoStage: number;
  scoreToNext: number | null;
  score: number;
};

const STAGES = [
  { stage: 1, name: "Embers", min: 0, max: 4, flavor: "A warm spark waiting to hatch." },
  { stage: 2, name: "Pip", min: 5, max: 11, flavor: "Curious eyes peek from the shell." },
  { stage: 3, name: "Rustle", min: 12, max: 22, flavor: "A playful pup wagging its tail." },
  { stage: 4, name: "Blaze", min: 23, max: 39, flavor: "Confident steps and a bushy tail." },
  { stage: 5, name: "Vixen", min: 40, max: 64, flavor: "Majestic and bright with a gentle glow." },
  { stage: 6, name: "Kitsune", min: 65, max: Infinity, flavor: "Elder fox with wisdom and light." },
];

export function useJournalFoxStage(distanceKm: number, stopCount: number): JournalFoxStage {
  const score = Math.max(0, (distanceKm * 2) + (stopCount * 3));
  return useMemo(() => {
    const stageInfo = STAGES.find(s => score >= s.min && score <= s.max) || STAGES[0];
    const into = score - stageInfo.min;
    const range = stageInfo.max - stageInfo.min;
    const percent = Math.min(100, Math.max(0, range > 0 ? (into / range) * 100 : 100));
    const next = stageInfo.stage < 6 ? (STAGES[stageInfo.stage].min - score) : null;
    return {
      stage: stageInfo.stage,
      creatureName: stageInfo.name,
      flavorText: stageInfo.flavor,
      progressPercent: percent,
      scoreIntoStage: Math.max(0, into),
      scoreToNext: next !== null ? Math.max(0, Math.ceil(next)) : null,
      score,
    };
  }, [score]);
}
