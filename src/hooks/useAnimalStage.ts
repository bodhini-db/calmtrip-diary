import { useMemo, useRef, useEffect, useState } from "react";

export type AnimalStageInfo = {
  stage: number;
  name: string;
  min: number;
  max: number | null;
  nextAt: number | null;
  changed: boolean;
};

const stages = [
  { stage: 1, name: "Embers", min: 0, max: 2 },
  { stage: 2, name: "Pip", min: 3, max: 5 },
  { stage: 3, name: "Rustle", min: 6, max: 10 },
  { stage: 4, name: "Blaze", min: 11, max: 19 },
  { stage: 5, name: "Vixen", min: 20, max: 34 },
  { stage: 6, name: "Kitsune", min: 35, max: null },
];

export function useAnimalStage(count: number) {
  const info = useMemo(() => {
    const s =
      stages.find((s) => count >= s.min && (s.max === null ? true : count <= s.max!)) ||
      stages[0];
    const nextAt = s.max !== null ? s.max + 1 : null;
    return { ...s, nextAt } as AnimalStageInfo;
  }, [count]);
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
