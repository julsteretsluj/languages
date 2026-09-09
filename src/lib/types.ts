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
  | "media"
  // Language-specific specialty units
  | "handshapes"
  | "nonmanuals"
  | "deafculture"
  | "tones"
  | "characters"
  | "measurewords"
  | "cases"
  | "declensions"
  | "conjugations"
  | "serestar"
  | "subjunctive"
  | "formality"
  | "separable"
  | "dutcharticles"
  | "particles"
  | "pepeha"
  | "marae";

export type Modality = "signed" | "spoken";

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type ExerciseType =
  | "multiple_choice"
  | "translate"
  | "match"
  | "fill_blank"
  | "true_false"
  | "arrange";

export interface VocabItem {
  term: string;
  meaning: string;
  /** CEFR / signed-proficiency band for this item */
  cefr?: CefrLevel;
  hint?: string;
  romanization?: string;
  note?: string;
  /** SignASL.org dictionary slug — https://www.signasl.org/sign/{signasl} */
  signasl?: string;
  /** SignBSL.com dictionary slug — https://www.signbsl.com/sign/{signbsl} */
  signbsl?: string;
  /** sonastik.ead.ee International Sign word ID — /embed/en/search?word={sonastik} */
  sonastik?: string;
  /** NZSL Online sign ID — https://www.nzsl.nz/signs/{nzsl} */
  nzsl?: string;
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
  /** Highest CEFR band this unit is designed to reach */
  cefr: CefrLevel;
  /**
   * If set, unit only appears on these language paths.
   * Omit for shared units available to every language.
   */
  languages?: LanguageId[];
}

export interface ExerciseMedia {
  /** SignASL.org dictionary slug for ASL video reference */
  signaslSlug?: string;
  /** SignBSL.com dictionary slug for BSL video reference */
  signbslSlug?: string;
  /** sonastik.ead.ee International Sign word ID */
  sonastikId?: string;
  /** NZSL Online sign ID */
  nzslId?: string;
}

export interface MultipleChoiceExercise extends ExerciseMedia {
  type: "multiple_choice";
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation?: string;
}

export interface TranslateExercise extends ExerciseMedia {
  type: "translate";
  id: string;
  prompt: string;
  direction: "to_en" | "from_en";
  accepted: string[];
  hint?: string;
}

export interface MatchExercise extends ExerciseMedia {
  type: "match";
  id: string;
  prompt: string;
  pairs: {
    left: string;
    right: string;
    signaslSlug?: string;
    signbslSlug?: string;
    sonastikId?: string;
    nzslId?: string;
  }[];
}

export interface FillBlankExercise extends ExerciseMedia {
  type: "fill_blank";
  id: string;
  prompt: string;
  sentence: string;
  accepted: string[];
  hint?: string;
}

export interface TrueFalseExercise extends ExerciseMedia {
  type: "true_false";
  id: string;
  prompt: string;
  statement: string;
  answer: boolean;
  explanation?: string;
}

export interface ArrangeExercise extends ExerciseMedia {
  type: "arrange";
  id: string;
  prompt: string;
  /** Rule being practiced, e.g. "SVO" or "Topic–comment" */
  pattern: string;
  /** Short teaching tip shown under the prompt */
  rule: string;
  /** English meaning of the target sentence */
  english: string;
  /** Correct token order */
  answer: string[];
  /** Shuffled chips shown to the learner (includes answer tokens) */
  tokens: string[];
  /** Dictionary keys for each answer token (signed languages) */
  tokenKeys?: string[];
  /** Which sign dictionary to use for token videos */
  videoProvider?: "asl" | "bsl" | "isl" | "nzsl";
  explanation?: string;
}

export type Exercise =
  | MultipleChoiceExercise
  | TranslateExercise
  | MatchExercise
  | FillBlankExercise
  | TrueFalseExercise
  | ArrangeExercise;

export interface Lesson {
  id: string;
  languageId: LanguageId;
  unitId: UnitId;
  index: number;
  title: string;
  subtitle?: string;
  cefr?: CefrLevel;
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
