"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AppProgress, LanguageId, UnitId } from "@/lib/types";
import {
  completeLesson,
  loadProgress,
  loseHeart,
  refillHearts,
  selectLanguage,
} from "@/lib/progress";

type Ctx = {
  progress: AppProgress;
  ready: boolean;
  chooseLanguage: (id: LanguageId) => void;
  finishLesson: (
    languageId: LanguageId,
    lessonId: string,
    unitId: UnitId,
    earnedXp: number,
    perfect: boolean,
  ) => void;
  missHeart: (languageId: LanguageId) => void;
  resetHearts: (languageId: LanguageId) => void;
};

const ProgressContext = createContext<Ctx | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<AppProgress>({
    selectedLanguage: null,
    languages: {},
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setProgress(loadProgress());
    setReady(true);
  }, []);

  const chooseLanguage = useCallback((id: LanguageId) => {
    setProgress((p) => selectLanguage(p, id));
  }, []);

  const finishLesson = useCallback(
    (
      languageId: LanguageId,
      lessonId: string,
      unitId: UnitId,
      earnedXp: number,
      perfect: boolean,
    ) => {
      setProgress((p) =>
        completeLesson(p, languageId, lessonId, unitId, earnedXp, perfect),
      );
    },
    [],
  );

  const missHeart = useCallback((languageId: LanguageId) => {
    setProgress((p) => loseHeart(p, languageId));
  }, []);

  const resetHearts = useCallback((languageId: LanguageId) => {
    setProgress((p) => refillHearts(p, languageId));
  }, []);

  const value = useMemo(
    () => ({
      progress,
      ready,
      chooseLanguage,
      finishLesson,
      missHeart,
      resetHearts,
    }),
    [progress, ready, chooseLanguage, finishLesson, missHeart, resetHearts],
  );

  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}
