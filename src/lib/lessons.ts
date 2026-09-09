import { getVocab } from "./content/vocab";
import {
  getGrammarSentences,
  getGrammarSentencesByCefr,
  type GrammarSentence,
} from "./content/grammar-sentences";
import { CEFR_LEVELS, CEFR_META, cefrIndex } from "./cefr";
import { getLanguage } from "./languages";
import { toSignaslSlug } from "./signasl";
import { toSignbslSlug } from "./signbsl";
import type {
  CefrLevel,
  Exercise,
  LanguageId,
  Lesson,
  UnitId,
  VocabItem,
} from "./types";
import { getUnitsForLanguage, UNITS } from "./units";

type LessonKind =
  | "focus"
  | "pair"
  | "trio"
  | "match"
  | "to_en"
  | "from_en"
  | "true_false"
  | "mixed"
  | "arrange"
  | "grammar_teach";

type LessonSpec = {
  kind: LessonKind;
  title: string;
  subtitle: string;
  items: VocabItem[];
  xp: number;
  cefr: CefrLevel;
  /** Grammar word-order sentences for arrange / teach lessons */
  sentences?: GrammarSentence[];
};

function hashSeed(...parts: (string | number)[]): number {
  const s = parts.join(":");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleSeeded<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors(
  item: VocabItem,
  pool: VocabItem[],
  n: number,
  rand: () => number,
): string[] {
  return shuffleSeeded(
    pool.filter((p) => p.meaning !== item.meaning),
    rand,
  )
    .slice(0, n)
    .map((p) => p.meaning);
}

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ");
}

export function answersMatch(input: string, accepted: string[]): boolean {
  const n = normalize(input);
  return accepted.some((a) => normalize(a) === n);
}

function resolveSignasl(languageId: LanguageId, item: VocabItem): string | undefined {
  if (languageId !== "asl") return undefined;
  return item.signasl || toSignaslSlug(item.term);
}

function resolveSignbsl(languageId: LanguageId, item: VocabItem): string | undefined {
  if (languageId !== "bsl") return undefined;
  return item.signbsl || toSignbslSlug(item.term);
}

function resolveSonastik(languageId: LanguageId, item: VocabItem): string | undefined {
  if (languageId !== "isl") return undefined;
  return item.sonastik;
}

function resolveNzsl(languageId: LanguageId, item: VocabItem): string | undefined {
  if (languageId !== "nzsl") return undefined;
  return item.nzsl;
}

function mediaFor(languageId: LanguageId, item: VocabItem) {
  return {
    signaslSlug: resolveSignasl(languageId, item),
    signbslSlug: resolveSignbsl(languageId, item),
    sonastikId: resolveSonastik(languageId, item),
    nzslId: resolveNzsl(languageId, item),
  };
}

function videoPrompt(
  languageId: LanguageId,
  map: Partial<Record<LanguageId, string>>,
  fallback: string,
): string {
  return map[languageId] ?? fallback;
}

function meaningAccepted(item: VocabItem): string[] {
  return [item.meaning, ...item.meaning.split(" / ").map((s) => s.trim())];
}

function termAccepted(item: VocabItem): string[] {
  return [
    item.term,
    ...item.term.split(" / ").map((s) => s.trim()),
    ...(item.romanization ? [item.romanization] : []),
    ...(item.signasl ? [item.signasl] : []),
    ...(item.signbsl ? [item.signbsl] : []),
    ...(item.sonastik ? [item.sonastik] : []),
    ...(item.nzsl ? [item.nzsl] : []),
  ];
}

function makeMc(
  languageId: LanguageId,
  unitId: UnitId,
  lessonIndex: number,
  item: VocabItem,
  pool: VocabItem[],
  rand: () => number,
  i: number,
): Exercise {
  const lang = getLanguage(languageId)!;
  const isSigned = lang.modality === "signed";
  const distractors = pickDistractors(item, pool, 3, rand);
  while (distractors.length < 3) distractors.push(`(option ${distractors.length + 1})`);
  return {
    type: "multiple_choice",
    id: `${languageId}-${unitId}-L${lessonIndex}-mc-${i}`,
    prompt: videoPrompt(
      languageId,
      {
        asl: "Watch the SignASL video — what does this sign mean?",
        bsl: "Watch the SignBSL video — what does this sign mean?",
        isl: "Watch the International Sign video — what does this sign mean?",
        nzsl: "Watch the NZSL Online video — what does this sign mean?",
      },
      isSigned
        ? `What does the sign/concept “${item.term}” mean?`
        : `What does “${item.term}” mean?`,
    ),
    options: shuffleSeeded([item.meaning, ...distractors.slice(0, 3)], rand),
    answer: item.meaning,
    explanation: item.hint || item.note || item.romanization,
    ...mediaFor(languageId, item),
  };
}

function makeTranslateToEn(
  languageId: LanguageId,
  unitId: UnitId,
  lessonIndex: number,
  item: VocabItem,
  i: number,
): Exercise {
  const isVideoLang =
    languageId === "asl" ||
    languageId === "bsl" ||
    languageId === "isl" ||
    languageId === "nzsl";
  return {
    type: "translate",
    id: `${languageId}-${unitId}-L${lessonIndex}-tr-${i}`,
    prompt: isVideoLang
      ? "Watch the sign, then translate it to English"
      : `Translate to English: ${item.term}`,
    direction: "to_en",
    accepted: meaningAccepted(item),
    hint: item.hint || item.romanization || (isVideoLang ? item.term : undefined),
    ...mediaFor(languageId, item),
  };
}

function makeTranslateFromEn(
  languageId: LanguageId,
  unitId: UnitId,
  lessonIndex: number,
  item: VocabItem,
  i: number,
): Exercise {
  const lang = getLanguage(languageId)!;
  return {
    type: "translate",
    id: `${languageId}-${unitId}-L${lessonIndex}-fr-${i}`,
    prompt: videoPrompt(
      languageId,
      {
        asl: `Which ASL gloss matches “${item.meaning.split(" / ")[0]}”?`,
        bsl: `Which BSL gloss matches “${item.meaning.split(" / ")[0]}”?`,
        isl: `Which IS gloss matches “${item.meaning.split(" / ")[0]}”?`,
        nzsl: `Which NZSL gloss matches “${item.meaning.split(" / ")[0]}”?`,
      },
      `How do you say “${item.meaning.split(" / ")[0]}” in ${lang.name}?`,
    ),
    direction: "from_en",
    accepted: termAccepted(item),
    hint: item.hint || item.note || item.romanization,
    ...mediaFor(languageId, item),
  };
}

function makeTf(
  languageId: LanguageId,
  unitId: UnitId,
  lessonIndex: number,
  item: VocabItem,
  pool: VocabItem[],
  rand: () => number,
  i: number,
): Exercise {
  const isVideoLang =
    languageId === "asl" ||
    languageId === "bsl" ||
    languageId === "isl" ||
    languageId === "nzsl";
  const truth = rand() > 0.4;
  const wrong =
    pickDistractors(item, pool, 1, rand)[0] || "something else";
  return {
    type: "true_false",
    id: `${languageId}-${unitId}-L${lessonIndex}-tf-${i}`,
    prompt: isVideoLang ? "Watch the video — true or false?" : "True or false?",
    statement: truth
      ? `“${item.term}” means “${item.meaning}”.`
      : `“${item.term}” means “${wrong}”.`,
    answer: truth,
    explanation: `Correct meaning: ${item.meaning}`,
    ...mediaFor(languageId, item),
  };
}

function makeMatch(
  languageId: LanguageId,
  unitId: UnitId,
  lessonIndex: number,
  items: VocabItem[],
): Exercise {
  const pairs = items.slice(0, Math.min(4, items.length));
  return {
    type: "match",
    id: `${languageId}-${unitId}-L${lessonIndex}-match`,
    prompt: videoPrompt(
      languageId,
      {
        asl: "Match each ASL gloss with its meaning",
        bsl: "Match each BSL gloss with its meaning",
        isl: "Match each IS gloss with its meaning",
        nzsl: "Match each NZSL gloss with its meaning",
      },
      "Match each term with its meaning",
    ),
    pairs: pairs.map((m) => ({
      left: m.term,
      right: m.meaning,
      ...mediaFor(languageId, m),
    })),
    ...mediaFor(languageId, pairs[0]),
  };
}

function makeFill(
  languageId: LanguageId,
  unitId: UnitId,
  lessonIndex: number,
  item: VocabItem,
  i: number,
): Exercise {
  const lang = getLanguage(languageId)!;
  const glossLabel =
    languageId === "asl"
      ? "ASL"
      : languageId === "bsl"
        ? "BSL"
        : languageId === "isl"
          ? "IS"
          : languageId === "nzsl"
            ? "NZSL"
            : null;
  return {
    type: "fill_blank",
    id: `${languageId}-${unitId}-L${lessonIndex}-fill-${i}`,
    prompt: glossLabel
      ? `Watch the video, then fill in the ${glossLabel} gloss`
      : "Fill in the blank",
    sentence: glossLabel
      ? `The ${glossLabel} gloss for “${item.meaning.split(" / ")[0]}” is _____.`
      : lang.modality === "signed"
        ? `The concept for “${item.meaning.split(" / ")[0]}” is _____.`
        : `The ${lang.name} word for “${item.meaning.split(" / ")[0]}” is _____.`,
    accepted: termAccepted(item),
    hint: item.hint,
    ...mediaFor(languageId, item),
  };
}

function makeArrange(
  languageId: LanguageId,
  unitId: UnitId,
  lessonIndex: number,
  sentence: GrammarSentence,
  i: number,
  rand: () => number,
): Exercise {
  // Signed languages: one dictionary gloss per chip (no multi-word compounds)
  const answer = sentence.tokens.map((t) => {
    if (languageId === "asl" || languageId === "bsl") {
      const single = t.trim().split(/[\s:/]+/)[0] ?? t;
      return single.toUpperCase();
    }
    return t;
  });
  const tokens = shuffleSeeded([...answer], rand);
  if (tokens.join("\0") === answer.join("\0") && tokens.length > 1) {
    [tokens[0], tokens[tokens.length - 1]] = [tokens[tokens.length - 1], tokens[0]];
  }
  const lang = getLanguage(languageId)!;
  const prompt =
    lang.modality === "signed"
      ? "Arrange the glosses in signing order"
      : `Arrange the words in correct ${lang.name} order`;

  const tokenKeys =
    languageId === "asl"
      ? answer.map((t) => toSignaslSlug(t))
      : languageId === "bsl"
        ? answer.map((t) => toSignbslSlug(t))
        : undefined;

  const videoProvider =
    languageId === "asl"
      ? ("asl" as const)
      : languageId === "bsl"
        ? ("bsl" as const)
        : undefined;

  return {
    type: "arrange",
    id: `${languageId}-${unitId}-L${lessonIndex}-arr-${sentence.id}-${i}`,
    prompt,
    pattern: sentence.pattern,
    rule: sentence.rule,
    english: sentence.english,
    answer,
    tokens,
    tokenKeys,
    videoProvider,
    explanation: sentence.note,
    // Lead video = first gloss in the correct sentence (topic / time)
    signaslSlug:
      languageId === "asl" && tokenKeys?.[0] ? tokenKeys[0] : undefined,
    signbslSlug:
      languageId === "bsl" && tokenKeys?.[0] ? tokenKeys[0] : undefined,
  };
}

function makeGrammarPatternMc(
  languageId: LanguageId,
  unitId: UnitId,
  lessonIndex: number,
  sentence: GrammarSentence,
  siblings: GrammarSentence[],
  i: number,
  rand: () => number,
): Exercise {
  const distractors = shuffleSeeded(
    siblings
      .filter((s) => s.pattern !== sentence.pattern)
      .map((s) => s.pattern),
    rand,
  ).slice(0, 3);
  while (distractors.length < 3) {
    distractors.push(`Pattern ${distractors.length + 1}`);
  }
  return {
    type: "multiple_choice",
    id: `${languageId}-${unitId}-L${lessonIndex}-gpat-${i}`,
    prompt: `Which word-order pattern builds “${sentence.english}”?`,
    options: shuffleSeeded([sentence.pattern, ...distractors.slice(0, 3)], rand),
    answer: sentence.pattern,
    explanation: sentence.rule,
  };
}

function makeGrammarRuleTf(
  languageId: LanguageId,
  unitId: UnitId,
  lessonIndex: number,
  sentence: GrammarSentence,
  i: number,
  rand: () => number,
): Exercise {
  const truthful = rand() > 0.4;
  const wrongRule =
    sentence.pattern.includes("SVO")
      ? "Always put the verb at the very end of every sentence."
      : sentence.pattern.toLowerCase().includes("topic")
        ? "Always put the verb first, before any topic."
        : "Word order never matters in this language.";
  return {
    type: "true_false",
    id: `${languageId}-${unitId}-L${lessonIndex}-grule-${i}`,
    prompt: "True or false about this grammar rule?",
    statement: truthful ? sentence.rule : wrongRule,
    answer: truthful,
    explanation: sentence.rule,
  };
}

function buildExercisesForSpec(
  languageId: LanguageId,
  unitId: UnitId,
  lessonIndex: number,
  spec: LessonSpec,
  pool: VocabItem[],
): Exercise[] {
  const rand = mulberry32(hashSeed(languageId, unitId, lessonIndex, spec.kind));
  const items = spec.items;
  const exercises: Exercise[] = [];
  const sentences = spec.sentences ?? [];

  if (spec.kind === "arrange") {
    sentences.forEach((s, i) => {
      exercises.push(makeArrange(languageId, unitId, lessonIndex, s, i, rand));
    });
    return exercises;
  }

  if (spec.kind === "grammar_teach") {
    const all = getGrammarSentences(languageId);
    sentences.forEach((s, i) => {
      exercises.push(
        makeGrammarPatternMc(languageId, unitId, lessonIndex, s, all, i, rand),
      );
      exercises.push(makeGrammarRuleTf(languageId, unitId, lessonIndex, s, i, rand));
      exercises.push(makeArrange(languageId, unitId, lessonIndex, s, i + 50, rand));
      // Second arrange attempt with reshuffle for production practice
      exercises.push(makeArrange(languageId, unitId, lessonIndex, s, i + 80, rand));
    });
    return exercises;
  }

  if (spec.kind === "match") {
    exercises.push(makeMatch(languageId, unitId, lessonIndex, items));
    return exercises;
  }

  if (spec.kind === "to_en") {
    for (let i = 0; i < items.length; i++) {
      exercises.push(makeTranslateToEn(languageId, unitId, lessonIndex, items[i], i));
    }
    return exercises;
  }

  if (spec.kind === "from_en") {
    for (let i = 0; i < items.length; i++) {
      exercises.push(makeTranslateFromEn(languageId, unitId, lessonIndex, items[i], i));
      if (i % 2 === 1) {
        exercises.push(makeFill(languageId, unitId, lessonIndex, items[i], i));
      }
    }
    return exercises;
  }

  if (spec.kind === "true_false") {
    for (let i = 0; i < items.length; i++) {
      exercises.push(makeTf(languageId, unitId, lessonIndex, items[i], pool, rand, i));
      exercises.push(makeTf(languageId, unitId, lessonIndex, items[i], pool, rand, i + 100));
    }
    return exercises;
  }

  // focus / pair / trio / mixed — dense mixed drills
  let i = 0;
  for (const item of items) {
    exercises.push(makeMc(languageId, unitId, lessonIndex, item, pool, rand, i++));
    exercises.push(makeTranslateToEn(languageId, unitId, lessonIndex, item, i++));
    exercises.push(makeTranslateFromEn(languageId, unitId, lessonIndex, item, i++));
    exercises.push(makeTf(languageId, unitId, lessonIndex, item, pool, rand, i++));
    if (spec.kind === "focus" || spec.kind === "mixed") {
      exercises.push(makeFill(languageId, unitId, lessonIndex, item, i++));
    }
  }
  if (items.length >= 3 && (spec.kind === "trio" || spec.kind === "mixed" || spec.kind === "pair")) {
    exercises.push(makeMatch(languageId, unitId, lessonIndex, items));
  }

  // Grammar mixed lessons also include arrange practice when sentences provided
  if (unitId === "grammar" && sentences.length) {
    for (let j = 0; j < sentences.length; j++) {
      exercises.push(makeArrange(languageId, unitId, lessonIndex, sentences[j], j + 200, rand));
    }
  }

  return exercises;
}

function getGrammarLessonSpecs(languageId: LanguageId): LessonSpec[] {
  const sentences = getGrammarSentences(languageId);
  const vocab = getVocab(languageId, "grammar");
  const specs: LessonSpec[] = [];

  // Opening: how word order works in this language
  const opener = sentences.slice(0, Math.min(3, sentences.length));
  if (opener.length) {
    specs.push({
      kind: "grammar_teach",
      title: "How word order works",
      subtitle: "Learn the core arranging pattern, then build sentences",
      items: vocab.slice(0, 3),
      sentences: opener,
      xp: 20,
      cefr: "A1",
    });
  }

  for (const level of CEFR_LEVELS) {
    const band = getGrammarSentencesByCefr(languageId, level);
    if (!band.length) continue;
    const meta = CEFR_META[level];

    specs.push({
      kind: "grammar_teach",
      title: `${level}: ${band[0].pattern}`,
      subtitle: `${meta.title} · ${band[0].rule}`,
      items: vocab.filter((v) => (v.cefr ?? "A1") === level).slice(0, 3),
      sentences: band.slice(0, 2),
      xp: 16 + cefrIndex(level) * 2,
      cefr: level,
    });

    specs.push({
      kind: "arrange",
      title: `${level}: arrange sentences`,
      subtitle: `Put words in ${meta.label} order`,
      items: [],
      sentences: band,
      xp: 18 + cefrIndex(level) * 2,
      cefr: level,
    });

    // Light metalanguage vocab still useful, but after arranging practice
    const vocabBand = vocab.filter((v) => (v.cefr ?? "A1") === level);
    if (vocabBand.length) {
      specs.push({
        kind: "focus",
        title: `${level}: grammar terms`,
        subtitle: "Name the patterns you just used",
        items: vocabBand.slice(0, 5),
        sentences: band.slice(0, 2),
        xp: 12 + cefrIndex(level),
        cefr: level,
      });
    }

    specs.push({
      kind: "mixed",
      title: `${level} grammar challenge`,
      subtitle: "Terms + sentence arranging",
      items: vocabBand.length ? vocabBand : vocab.slice(0, 4),
      sentences: band,
      xp: 22 + cefrIndex(level) * 2,
      cefr: level,
    });
  }

  specs.push({
    kind: "arrange",
    title: "C2 arranging mastery",
    subtitle: "Build every pattern from A1 through C2",
    items: [],
    sentences,
    xp: 40,
    cefr: "C2",
  });

  return specs;
}

/** Build CEFR-banded lessons — every unit climbs A1→C2. */
export function getUnitLessonSpecs(
  languageId: LanguageId,
  unitId: UnitId,
): LessonSpec[] {
  if (unitId === "grammar") {
    return getGrammarLessonSpecs(languageId);
  }

  const vocab = getVocab(languageId, unitId);
  if (!vocab.length) return [];

  const specs: LessonSpec[] = [];
  const chunkSize = 5;

  for (const level of CEFR_LEVELS) {
    const band = vocab.filter((v) => (v.cefr ?? "A1") === level);
    if (!band.length) continue;

    const meta = CEFR_META[level];
    const chunks: VocabItem[][] = [];
    for (let i = 0; i < band.length; i += chunkSize) {
      chunks.push(band.slice(i, i + chunkSize));
    }

    chunks.forEach((chunk, ci) => {
      const pack = ci + 1;
      specs.push({
        kind: "focus",
        title: `${level} pack ${pack}: learn`,
        subtitle: `${meta.title} · ${chunk.map((c) => c.term).join(", ")}`,
        items: chunk,
        xp: 12 + cefrIndex(level) * 2,
        cefr: level,
      });
      specs.push({
        kind: "from_en",
        title: `${level} pack ${pack}: produce`,
        subtitle: `Produce ${level} forms`,
        items: chunk,
        xp: 12 + cefrIndex(level) * 2,
        cefr: level,
      });
      if (chunk.length >= 2) {
        specs.push({
          kind: "match",
          title: `${level} pack ${pack}: match`,
          subtitle: "Connect terms to meanings",
          items: chunk,
          xp: 10 + cefrIndex(level) * 2,
          cefr: level,
        });
      }
      specs.push({
        kind: "true_false",
        title: `${level} pack ${pack}: check`,
        subtitle: "Quick accuracy checks",
        items: chunk,
        xp: 10 + cefrIndex(level),
        cefr: level,
      });
    });

    specs.push({
      kind: "mixed",
      title: `${level} band challenge`,
      subtitle: meta.blurb,
      items: band,
      xp: 18 + cefrIndex(level) * 3,
      cefr: level,
    });
  }

  specs.push({
    kind: "mixed",
    title: "C2 unit mastery",
    subtitle: `Finish ${unitId} at ${CEFR_META.C2.title}`,
    items: vocab,
    xp: 40,
    cefr: "C2",
  });

  return specs;
}

export function getUnitLessonCount(languageId: LanguageId, unitId: UnitId): number {
  return getUnitLessonSpecs(languageId, unitId).length;
}

export function getLesson(
  languageId: LanguageId,
  unitId: UnitId,
  lessonIndex = 1,
): Lesson | null {
  const unit = UNITS.find((u) => u.id === unitId);
  if (!unit) return null;
  const specs = getUnitLessonSpecs(languageId, unitId);
  const spec = specs[lessonIndex - 1];
  if (!spec) return null;
  const pool = getVocab(languageId, unitId).filter(
    (v) => cefrIndex(v.cefr ?? "A1") <= cefrIndex(spec.cefr),
  );

  return {
    id: `${languageId}-${unitId}-L${lessonIndex}`,
    languageId,
    unitId,
    index: lessonIndex,
    title: spec.title,
    subtitle: spec.subtitle,
    cefr: spec.cefr,
    xp: spec.xp,
    exercises: buildExercisesForSpec(languageId, unitId, lessonIndex, spec, pool),
  };
}

export function getUnitLessons(languageId: LanguageId, unitId: UnitId): Lesson[] {
  const count = getUnitLessonCount(languageId, unitId);
  const lessons: Lesson[] = [];
  for (let i = 1; i <= count; i++) {
    const lesson = getLesson(languageId, unitId, i);
    if (lesson) lessons.push(lesson);
  }
  return lessons;
}

export function getAllLessonIds(languageId: LanguageId): string[] {
  const ids: string[] = [];
  for (const unit of getUnitsForLanguage(languageId)) {
    const count = getUnitLessonCount(languageId, unit.id);
    for (let i = 1; i <= count; i++) {
      ids.push(`${languageId}-${unit.id}-L${i}`);
    }
  }
  return ids;
}

export function getTotalLessonCount(languageId: LanguageId): number {
  return getAllLessonIds(languageId).length;
}

export function isUnitComplete(
  languageId: LanguageId,
  unitId: UnitId,
  completedLessons: string[],
): boolean {
  const count = getUnitLessonCount(languageId, unitId);
  if (count === 0) return false;
  const set = new Set(completedLessons);
  // Support legacy single-lesson id
  if (set.has(`${languageId}-${unitId}`)) return true;
  for (let i = 1; i <= count; i++) {
    if (!set.has(`${languageId}-${unitId}-L${i}`)) return false;
  }
  return true;
}

export function getNextLessonRef(
  languageId: LanguageId,
  completedLessons: string[],
): { unitId: UnitId; lessonIndex: number } | null {
  for (const unit of getUnitsForLanguage(languageId)) {
    const count = getUnitLessonCount(languageId, unit.id);
    for (let i = 1; i <= count; i++) {
      const id = `${languageId}-${unit.id}-L${i}`;
      if (
        !completedLessons.includes(id) &&
        !completedLessons.includes(`${languageId}-${unit.id}`)
      ) {
        return { unitId: unit.id, lessonIndex: i };
      }
    }
  }
  return null;
}
