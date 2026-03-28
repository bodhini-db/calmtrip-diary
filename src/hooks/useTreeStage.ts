import { useMemo, useRef, useEffect, useState } from "react";

export type TreeStageInfo = {
  stage: number;
  name: string;
  min: number;
  max: number | null;
  nextAt: number | null;
  changed: boolean;
};

const stages = [
  { stage: 1, name: "Nutling", min: 0, max: 4 },
  { stage: 2, name: "Springa", min: 5, max: 14 },
  { stage: 3, name: "Twig", min: 15, max: 29 },
  { stage: 4, name: "Rootsworth", min: 30, max: 59 },
  { stage: 5, name: "Canopy", min: 60, max: 99 },
  { stage: 6, name: "Eld", min: 100, max: null },
];

export function useTreeStage(km: number) {
  const info = useMemo(() => {
    const s =
      stages.find((s) => km >= s.min && (s.max === null ? true : km <= s.max!)) ||
      stages[0];
    const nextAt = s.max !== null ? s.max + 1 : null;
    return { ...s, nextAt } as TreeStageInfo;
  }, [km]);
  const prevRef = useRef<number | null>(null);
  const [changed, setChanged] = useState(false);
  useEffect(() => {
    if (prevRef.current !== null && prevRef.current !== info.stage) {
      setChanged(true);
      const t = setTimeout(() => setChanged(false), 1200);
      return () => clearTimeout(t);
    }
    prevRef.current = info.stage;
  }, [info.stage]);
  return { ...info, changed };
}
