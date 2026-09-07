import type {
  AppProgress,
  LanguageId,
  LanguageProgress,
  UnitId,
} from "./types";

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

function mergeLang(
  a: LanguageProgress | undefined,
  b: LanguageProgress | undefined,
): LanguageProgress {
  const left = a ?? emptyLang();
  const right = b ?? emptyLang();
  const lessons = Array.from(
    new Set([...left.completedLessons, ...right.completedLessons]),
  );
  const unitStars: Partial<Record<UnitId, number>> = {
    ...left.unitStars,
  };
  for (const [unit, stars] of Object.entries(right.unitStars)) {
    const id = unit as UnitId;
    unitStars[id] = Math.max(unitStars[id] ?? 0, stars ?? 0);
  }
  const leftDate = left.lastStudyDate;
  const rightDate = right.lastStudyDate;
  let lastStudyDate = leftDate;
  let streak = left.streak;
  if (!leftDate || (rightDate && rightDate > leftDate)) {
    lastStudyDate = rightDate;
    streak = right.streak;
  } else if (rightDate === leftDate) {
    streak = Math.max(left.streak, right.streak);
  }
  return {
    xp: Math.max(left.xp, right.xp),
    streak,
    lastStudyDate,
    completedLessons: lessons,
    hearts: Math.max(left.hearts, right.hearts),
    unitStars,
  };
}

/** Merge guest (local) + cloud progress so nothing is lost on login. */
export function mergeProgress(local: AppProgress, cloud: AppProgress): AppProgress {
  const langIds = new Set([
    ...Object.keys(local.languages),
    ...Object.keys(cloud.languages),
  ]) as Set<string>;

  const languages: AppProgress["languages"] = {};
  for (const id of langIds) {
    const key = id as LanguageId;
    languages[key] = mergeLang(local.languages[key], cloud.languages[key]);
  }

  return {
    selectedLanguage: local.selectedLanguage ?? cloud.selectedLanguage,
    languages,
  };
}

export function emptyProgress(): AppProgress {
  return { selectedLanguage: null, languages: {} };
}

export function isAppProgress(value: unknown): value is AppProgress {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return "languages" in v && typeof v.languages === "object";
}
