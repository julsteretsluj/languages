"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AppProgress, LanguageId, UnitId } from "@/lib/types";
import {
  completeLesson,
  loadProgress,
  loseHeart,
  refillHearts,
  saveProgress,
  selectLanguage,
} from "@/lib/progress";
import {
  emptyProgress,
  isAppProgress,
  mergeProgress,
} from "@/lib/progress-sync";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "./AuthProvider";

type Ctx = {
  progress: AppProgress;
  ready: boolean;
  syncing: boolean;
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

async function fetchCloudProgress(userId: string): Promise<AppProgress | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_progress")
    .select("progress")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.progress) return null;
  return isAppProgress(data.progress) ? data.progress : null;
}

async function upsertCloudProgress(userId: string, progress: AppProgress) {
  const supabase = createClient();
  const { error } = await supabase.from("user_progress").upsert(
    {
      user_id: userId,
      progress,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { user, ready: authReady } = useAuth();
  const [progress, setProgress] = useState<AppProgress>(emptyProgress());
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUserId = useRef<string | null>(null);

  const persistCloud = useCallback((userId: string, next: AppProgress) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void upsertCloudProgress(userId, next).catch((err) => {
        console.error("Failed to sync progress", err);
      });
    }, 400);
  }, []);

  // Load local progress once auth is ready, then merge cloud if signed in.
  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;

    async function hydrate() {
      const local = loadProgress();
      if (!isSupabaseConfigured() || !user) {
        if (!cancelled) {
          setProgress(local);
          setReady(true);
          lastUserId.current = null;
        }
        return;
      }

      // Avoid re-merging on every token refresh for the same user
      if (lastUserId.current === user.id && ready) return;

      setSyncing(true);
      try {
        const cloud = await fetchCloudProgress(user.id);
        const merged = cloud ? mergeProgress(local, cloud) : local;
        saveProgress(merged);
        await upsertCloudProgress(user.id, merged);
        if (!cancelled) {
          setProgress(merged);
          lastUserId.current = user.id;
          setReady(true);
        }
      } catch (err) {
        console.error("Progress sync failed", err);
        if (!cancelled) {
          setProgress(local);
          setReady(true);
        }
      } finally {
        if (!cancelled) setSyncing(false);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, user?.id]);

  const apply = useCallback(
    (updater: (p: AppProgress) => AppProgress) => {
      setProgress((prev) => {
        const next = updater(prev);
        saveProgress(next);
        if (user) persistCloud(user.id, next);
        return next;
      });
    },
    [user, persistCloud],
  );

  const chooseLanguage = useCallback(
    (id: LanguageId) => {
      apply((p) => selectLanguage(p, id));
    },
    [apply],
  );

  const finishLesson = useCallback(
    (
      languageId: LanguageId,
      lessonId: string,
      unitId: UnitId,
      earnedXp: number,
      perfect: boolean,
    ) => {
      apply((p) =>
        completeLesson(p, languageId, lessonId, unitId, earnedXp, perfect),
      );
    },
    [apply],
  );

  const missHeart = useCallback(
    (languageId: LanguageId) => {
      apply((p) => loseHeart(p, languageId));
    },
    [apply],
  );

  const resetHearts = useCallback(
    (languageId: LanguageId) => {
      apply((p) => refillHearts(p, languageId));
    },
    [apply],
  );

  const value = useMemo(
    () => ({
      progress,
      ready,
      syncing,
      chooseLanguage,
      finishLesson,
      missHeart,
      resetHearts,
    }),
    [
      progress,
      ready,
      syncing,
      chooseLanguage,
      finishLesson,
      missHeart,
      resetHearts,
    ],
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
