import { getVocab } from "./content/vocab";
import { getLanguage } from "./languages";
import { toSignaslSlug } from "./signasl";
import { toSignbslSlug } from "./signbsl";
import type {
  Exercise,
  LanguageId,
  Lesson,
  UnitId,
  VocabItem,
} from "./types";
import { UNITS } from "./units";

type LessonKind =
  | "focus"
  | "pair"
  | "trio"
  | "match"
  | "to_en"
  | "from_en"
  | "true_false"
  | "mixed";

type LessonSpec = {
  kind: LessonKind;
  title: string;
  subtitle: string;
  items: VocabItem[];
  xp: number;
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

  return exercises;
}

/** Build the densest practical lesson plan for a unit's vocab. */
export function getUnitLessonSpecs(
  languageId: LanguageId,
  unitId: UnitId,
): LessonSpec[] {
  const vocab = getVocab(languageId, unitId);
  if (!vocab.length) return [];

  const specs: LessonSpec[] = [];

  // 1) Focus lesson per vocab item
  vocab.forEach((item, idx) => {
    specs.push({
      kind: "focus",
      title: `Focus: ${item.term}`,
      subtitle: item.meaning.split(" / ")[0],
      items: [item],
      xp: 12,
    });
    // Extra deep-dive for each item (production heavy)
    specs.push({
      kind: "from_en",
      title: `Produce: ${item.term}`,
      subtitle: `Say/sign “${item.meaning.split(" / ")[0]}”`,
      items: [item],
      xp: 10,
    });
    specs.push({
      kind: "true_false",
      title: `Check: ${item.term}`,
      subtitle: "True or false drills",
      items: [item, ...vocab.filter((_, j) => j !== idx).slice(0, 2)],
      xp: 10,
    });
  });

  // 2) Adjacent pairs
  for (let i = 0; i < vocab.length - 1; i++) {
    const pair = [vocab[i], vocab[i + 1]];
    specs.push({
      kind: "pair",
      title: `Pair ${i + 1}: ${pair[0].term} & ${pair[1].term}`,
      subtitle: "Two-term practice",
      items: pair,
      xp: 14,
    });
  }

  // 3) Sliding trios
  for (let i = 0; i < vocab.length - 2; i++) {
    const trio = vocab.slice(i, i + 3);
    specs.push({
      kind: "trio",
      title: `Trio ${i + 1}`,
      subtitle: trio.map((t) => t.term).join(" · "),
      items: trio,
      xp: 16,
    });
  }

  // 4) Whole-unit reviews
  specs.push({
    kind: "match",
    title: "Match review",
    subtitle: "Connect every term to its meaning",
    items: vocab,
    xp: 15,
  });
  specs.push({
    kind: "to_en",
    title: "Translate to English",
    subtitle: "Recognize every term in this unit",
    items: vocab,
    xp: 15,
  });
  specs.push({
    kind: "from_en",
    title: "Translate from English",
    subtitle: "Produce every term in this unit",
    items: vocab,
    xp: 15,
  });
  specs.push({
    kind: "true_false",
    title: "True / false gauntlet",
    subtitle: "Speed checks across the unit",
    items: vocab,
    xp: 15,
  });
  specs.push({
    kind: "mixed",
    title: "Unit challenge",
    subtitle: "Mixed skills — final boss of this unit",
    items: vocab,
    xp: 20,
  });

  // 5) Reverse-order mixed pass for more practice
  specs.push({
    kind: "mixed",
    title: "Bonus remix",
    subtitle: "Same unit, reshuffled challenge",
    items: [...vocab].reverse(),
    xp: 18,
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
  const pool = getVocab(languageId, unitId);

  return {
    id: `${languageId}-${unitId}-L${lessonIndex}`,
    languageId,
    unitId,
    index: lessonIndex,
    title: spec.title,
    subtitle: spec.subtitle,
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
  for (const unit of UNITS) {
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
  for (const unit of UNITS) {
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
