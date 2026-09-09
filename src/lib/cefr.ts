import type { CefrLevel, LanguageId, UnitId } from "./types";

/** Specialty units that only appear for matching languages. */
export const EXTRA_UNIT_IDS = [
  "handshapes",
  "nonmanuals",
  "deafculture",
  "tones",
  "characters",
  "measurewords",
  "cases",
  "declensions",
  "conjugations",
  "serestar",
  "subjunctive",
  "formality",
  "separable",
  "dutcharticles",
  "particles",
  "pepeha",
  "marae",
] as const;

export type ExtraUnitId = (typeof EXTRA_UNIT_IDS)[number];

export const UNIT_CEFR: Record<UnitId, CefrLevel> = {
  grammar: "A1",
  alphabet: "A1",
  pronouns: "A1",
  nouns: "A1",
  verbs: "A1",
  adjectives: "A1",
  colors: "A1",
  maths: "A1",
  time: "A2",
  emotions: "A2",
  body: "A2",
  senses: "A2",
  clothing: "A2",
  food: "A2",
  animals: "A2",
  furniture: "A2",
  occupations: "B1",
  school: "B1",
  travel: "B1",
  countries: "B1",
  culture: "B1",
  medical: "B1",
  politics: "B2",
  technology: "B2",
  psychology: "B2",
  speaking: "B2",
  reading: "C1",
  writing: "C1",
  translating: "C1",
  slang: "C1",
  quotes: "C2",
  media: "C2",
  // Language specialties
  handshapes: "A1",
  nonmanuals: "A2",
  deafculture: "B1",
  tones: "A1",
  characters: "A2",
  measurewords: "B1",
  cases: "A1",
  declensions: "A2",
  conjugations: "B1",
  serestar: "A2",
  subjunctive: "B2",
  formality: "B1",
  separable: "A2",
  dutcharticles: "A1",
  particles: "A1",
  pepeha: "A2",
  marae: "B1",
};

export const CEFR_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const CEFR_META: Record<
  CefrLevel,
  { label: string; title: string; blurb: string; color: string }
> = {
  A1: {
    label: "A1",
    title: "Breakthrough",
    blurb: "Survival phrases and core building blocks",
    color: "#34C759",
  },
  A2: {
    label: "A2",
    title: "Waystage",
    blurb: "Everyday life and simple conversations",
    color: "#30B0C7",
  },
  B1: {
    label: "B1",
    title: "Threshold",
    blurb: "Travel, work, and clear connected speech",
    color: "#007AFF",
  },
  B2: {
    label: "B2",
    title: "Vantage",
    blurb: "Abstract topics and fluent discussion",
    color: "#5856D6",
  },
  C1: {
    label: "C1",
    title: "Effective operational",
    blurb: "Nuance, register, and complex texts",
    color: "#AF52DE",
  },
  C2: {
    label: "C2",
    title: "Mastery",
    blurb: "Near-native precision, idiom, and style",
    color: "#FF2D95",
  },
};

export function cefrIndex(level: CefrLevel): number {
  return CEFR_LEVELS.indexOf(level);
}

export function cefrAtMost(level: CefrLevel): CefrLevel[] {
  const i = cefrIndex(level);
  return CEFR_LEVELS.filter((_, idx) => idx <= i);
}

export function highestCefrCompleted(unitIdsDone: UnitId[]): CefrLevel | null {
  if (!unitIdsDone.length) return null;
  let best: CefrLevel = "A1";
  for (const id of unitIdsDone) {
    const level = UNIT_CEFR[id];
    if (cefrIndex(level) > cefrIndex(best)) best = level;
  }
  return best;
}

/** Signed languages use a parallel proficiency frame mapped onto CEFR labels. */
export function cefrLabelForModality(
  level: CefrLevel,
  modality: "signed" | "spoken",
): string {
  if (modality === "spoken") return level;
  const signed: Record<CefrLevel, string> = {
    A1: "A1 · Novice",
    A2: "A2 · Emerging",
    B1: "B1 · Intermediate",
    B2: "B2 · Fluent",
    C1: "C1 · Advanced",
    C2: "C2 · Proficient",
  };
  return signed[level];
}

export type { LanguageId };