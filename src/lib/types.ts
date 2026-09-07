export type LanguageId =
  | "asl"
  | "bsl"
  | "isl"
  | "nzsl"
  | "maori"
  | "mandarin"
  | "latin"
  | "dutch"
  | "spanish";

export type UnitId =
  | "grammar"
  | "alphabet"
  | "pronouns"
  | "nouns"
  | "verbs"
  | "adjectives"
  | "colors"
  | "maths"
  | "time"
  | "emotions"
  | "body"
  | "senses"
  | "clothing"
  | "food"
  | "animals"
  | "furniture"
  | "occupations"
  | "school"
  | "travel"
  | "countries"
  | "culture"
  | "medical"
  | "politics"
  | "technology"
  | "psychology"
  | "speaking"
  | "reading"
  | "writing"
  | "translating"
  | "slang"
  | "quotes"
  | "media";

export type Modality = "signed" | "spoken";

export type ExerciseType =
  | "multiple_choice"
  | "translate"
  | "match"
  | "fill_blank"
  | "true_false";

export interface VocabItem {
  term: string;
  meaning: string;
  hint?: string;
  romanization?: string;
  note?: string;
}

export interface Language {
  id: LanguageId;
  name: string;
  nativeName: string;
  flag: string;
  modality: Modality;
  accent: string;
  description: string;
}

export interface UnitDef {
  id: UnitId;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
}

export interface MultipleChoiceExercise {
  type: "multiple_choice";
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation?: string;
}

export interface TranslateExercise {
  type: "translate";
  id: string;
  prompt: string;
  direction: "to_en" | "from_en";
  accepted: string[];
  hint?: string;
}

export interface MatchExercise {
  type: "match";
  id: string;
  prompt: string;
  pairs: { left: string; right: string }[];
}

export interface FillBlankExercise {
  type: "fill_blank";
  id: string;
  prompt: string;
  sentence: string;
  accepted: string[];
  hint?: string;
}

export interface TrueFalseExercise {
  type: "true_false";
  id: string;
  prompt: string;
  statement: string;
  answer: boolean;
  explanation?: string;
}

export type Exercise =
  | MultipleChoiceExercise
  | TranslateExercise
  | MatchExercise
  | FillBlankExercise
  | TrueFalseExercise;

export interface Lesson {
  id: string;
  languageId: LanguageId;
  unitId: UnitId;
  title: string;
  xp: number;
  exercises: Exercise[];
}

export interface LanguageProgress {
  xp: number;
  streak: number;
  lastStudyDate: string | null;
  completedLessons: string[];
  hearts: number;
  unitStars: Partial<Record<UnitId, number>>;
}

export interface AppProgress {
  selectedLanguage: LanguageId | null;
  languages: Partial<Record<LanguageId, LanguageProgress>>;
}
