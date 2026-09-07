"use client";

import type { AppProgress, LanguageId, LanguageProgress, UnitId } from "./types";

const KEY = "lingora-progress-v3";

function emptyLang(): LanguageProgress {
  return {
    xp: 0,
    streak: 0,
    lastStudyDate: null,
    completedLessons: [],
    hearts: 5,
    unitStars: {},
  };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function loadProgress(): AppProgress {
  if (typeof window === "undefined") {
    return { selectedLanguage: null, languages: {} };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { selectedLanguage: null, languages: {} };
    return JSON.parse(raw) as AppProgress;
  } catch {
    return { selectedLanguage: null, languages: {} };
  }
}

export function saveProgress(progress: AppProgress): void {
  localStorage.setItem(KEY, JSON.stringify(progress));
}

export function getLangProgress(
  progress: AppProgress,
  id: LanguageId,
): LanguageProgress {
  return progress.languages[id] ?? emptyLang();
}

export function selectLanguage(
  progress: AppProgress,
  id: LanguageId,
): AppProgress {
  const next = {
    ...progress,
    selectedLanguage: id,
    languages: {
      ...progress.languages,
      [id]: progress.languages[id] ?? emptyLang(),
    },
  };
  saveProgress(next);
  return next;
}

export function completeLesson(
  progress: AppProgress,
  languageId: LanguageId,
  lessonId: string,
  unitId: UnitId,
  earnedXp: number,
  perfect: boolean,
): AppProgress {
  const lang = { ...getLangProgress(progress, languageId) };
  const t = today();
  if (lang.lastStudyDate !== t) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const y = yesterday.toISOString().slice(0, 10);
    lang.streak = lang.lastStudyDate === y ? lang.streak + 1 : 1;
    lang.lastStudyDate = t;
  }
  if (!lang.completedLessons.includes(lessonId)) {
    lang.completedLessons = [...lang.completedLessons, lessonId];
  }
  lang.xp += earnedXp;
  const prev = lang.unitStars[unitId] ?? 0;
  lang.unitStars = {
    ...lang.unitStars,
    [unitId]: Math.max(prev, perfect ? 3 : 2),
  };
  lang.hearts = Math.min(5, lang.hearts + 1);

  const next = {
    ...progress,
    languages: { ...progress.languages, [languageId]: lang },
  };
  saveProgress(next);
  return next;
}

export function loseHeart(
  progress: AppProgress,
  languageId: LanguageId,
): AppProgress {
  const lang = { ...getLangProgress(progress, languageId) };
  lang.hearts = Math.max(0, lang.hearts - 1);
  const next = {
    ...progress,
    languages: { ...progress.languages, [languageId]: lang },
  };
  saveProgress(next);
  return next;
}

export function refillHearts(
  progress: AppProgress,
  languageId: LanguageId,
): AppProgress {
  const lang = { ...getLangProgress(progress, languageId), hearts: 5 };
  const next = {
    ...progress,
    languages: { ...progress.languages, [languageId]: lang },
  };
  saveProgress(next);
  return next;
}
