import { getVocab } from "./content/vocab";
import { getLanguage } from "./languages";
import type {
  Exercise,
  LanguageId,
  Lesson,
  UnitId,
  VocabItem,
} from "./types";
import { UNITS } from "./units";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors(item: VocabItem, pool: VocabItem[], n: number): string[] {
  return shuffle(pool.filter((p) => p.meaning !== item.meaning))
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

function buildExercises(
  languageId: LanguageId,
  unitId: UnitId,
  vocab: VocabItem[],
): Exercise[] {
  const lang = getLanguage(languageId)!;
  const isSigned = lang.modality === "signed";
  const pool = vocab.length >= 4 ? vocab : vocab;
  const items = shuffle(pool).slice(0, Math.min(6, pool.length));
  const exercises: Exercise[] = [];
  let i = 0;

  for (const item of items) {
    const distractors = pickDistractors(item, pool, 3);
    while (distractors.length < 3) {
      distractors.push(`(option ${distractors.length + 1})`);
    }

    if (i % 5 === 0) {
      exercises.push({
        type: "multiple_choice",
        id: `${languageId}-${unitId}-mc-${i}`,
        prompt: isSigned
          ? `What does the sign/concept “${item.term}” mean?`
          : `What does “${item.term}” mean?`,
        options: shuffle([item.meaning, ...distractors.slice(0, 3)]),
        answer: item.meaning,
        explanation: item.hint || item.note || item.romanization,
      });
    } else if (i % 5 === 1) {
      exercises.push({
        type: "translate",
        id: `${languageId}-${unitId}-tr-${i}`,
        prompt: `Translate to English: ${item.term}`,
        direction: "to_en",
        accepted: [item.meaning, ...item.meaning.split(" / ").map((s) => s.trim())],
        hint: item.hint || item.romanization,
      });
    } else if (i % 5 === 2) {
      exercises.push({
        type: "translate",
        id: `${languageId}-${unitId}-fr-${i}`,
        prompt: `How do you say “${item.meaning.split(" / ")[0]}” in ${lang.name}?`,
        direction: "from_en",
        accepted: [
          item.term,
          ...item.term.split(" / ").map((s) => s.trim()),
          ...(item.romanization ? [item.romanization] : []),
        ],
        hint: item.hint || (isSigned ? item.note : item.romanization),
      });
    } else if (i % 5 === 3) {
      exercises.push({
        type: "true_false",
        id: `${languageId}-${unitId}-tf-${i}`,
        prompt: "True or false?",
        statement: `“${item.term}” means “${item.meaning}”.`,
        answer: true,
        explanation: item.hint,
      });
    } else {
      const wrong = distractors[0] || "something else";
      const truth = Math.random() > 0.45;
      exercises.push({
        type: "true_false",
        id: `${languageId}-${unitId}-tf2-${i}`,
        prompt: "True or false?",
        statement: truth
          ? `“${item.term}” means “${item.meaning}”.`
          : `“${item.term}” means “${wrong}”.`,
        answer: truth,
        explanation: `Correct meaning: ${item.meaning}`,
      });
    }
    i++;
  }

  const matchItems = shuffle(pool).slice(0, Math.min(4, pool.length));
  if (matchItems.length >= 3) {
    exercises.push({
      type: "match",
      id: `${languageId}-${unitId}-match`,
      prompt: "Match each term with its meaning",
      pairs: matchItems.map((m) => ({ left: m.term, right: m.meaning })),
    });
  }

  const fill = shuffle(pool)[0];
  if (fill) {
    exercises.push({
      type: "fill_blank",
      id: `${languageId}-${unitId}-fill`,
      prompt: "Fill in the blank",
      sentence: isSigned
        ? `The concept for “${fill.meaning.split(" / ")[0]}” is _____.`
        : `The ${lang.name} word for “${fill.meaning.split(" / ")[0]}” is _____.`,
      accepted: [
        fill.term,
        ...fill.term.split(" / ").map((s) => s.trim()),
        ...(fill.romanization ? [fill.romanization] : []),
      ],
      hint: fill.hint,
    });
  }

  return exercises;
}

export function getLesson(languageId: LanguageId, unitId: UnitId): Lesson {
  const unit = UNITS.find((u) => u.id === unitId)!;
  const vocab = getVocab(languageId, unitId);
  return {
    id: `${languageId}-${unitId}`,
    languageId,
    unitId,
    title: unit.title,
    xp: 15,
    exercises: buildExercises(languageId, unitId, vocab),
  };
}

export function getAllLessonIds(languageId: LanguageId): string[] {
  return UNITS.map((u) => `${languageId}-${u.id}`);
}
