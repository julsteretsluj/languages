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

function videoPrompt(
  languageId: LanguageId,
  map: Partial<Record<LanguageId, string>>,
  fallback: string,
): string {
  return map[languageId] ?? fallback;
}

function buildExercises(
  languageId: LanguageId,
  unitId: UnitId,
  vocab: VocabItem[],
): Exercise[] {
  const lang = getLanguage(languageId)!;
  const isAsl = languageId === "asl";
  const isBsl = languageId === "bsl";
  const isIsl = languageId === "isl";
  const isNzsl = languageId === "nzsl";
  const isVideoLang = isAsl || isBsl || isIsl || isNzsl;
  const isSigned = lang.modality === "signed";
  const pool = vocab;
  const items = shuffle(pool).slice(0, Math.min(6, pool.length));
  const exercises: Exercise[] = [];
  let i = 0;

  for (const item of items) {
    const distractors = pickDistractors(item, pool, 3);
    while (distractors.length < 3) {
      distractors.push(`(option ${distractors.length + 1})`);
    }
    const media = {
      signaslSlug: resolveSignasl(languageId, item),
      signbslSlug: resolveSignbsl(languageId, item),
      sonastikId: resolveSonastik(languageId, item),
      nzslId: resolveNzsl(languageId, item),
    };

    if (i % 5 === 0) {
      exercises.push({
        type: "multiple_choice",
        id: `${languageId}-${unitId}-mc-${i}`,
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
        options: shuffle([item.meaning, ...distractors.slice(0, 3)]),
        answer: item.meaning,
        explanation: item.hint || item.note || item.romanization,
        ...media,
      });
    } else if (i % 5 === 1) {
      exercises.push({
        type: "translate",
        id: `${languageId}-${unitId}-tr-${i}`,
        prompt: isVideoLang
          ? "Watch the sign, then translate it to English"
          : `Translate to English: ${item.term}`,
        direction: "to_en",
        accepted: [item.meaning, ...item.meaning.split(" / ").map((s) => s.trim())],
        hint: item.hint || item.romanization || (isVideoLang ? item.term : undefined),
        ...media,
      });
    } else if (i % 5 === 2) {
      exercises.push({
        type: "translate",
        id: `${languageId}-${unitId}-fr-${i}`,
        prompt: videoPrompt(
          languageId,
          {
            asl: `Which ASL gloss matches “${item.meaning.split(" / ")[0]}”? (Watch SignASL for help)`,
            bsl: `Which BSL gloss matches “${item.meaning.split(" / ")[0]}”? (Watch SignBSL for help)`,
            isl: `Which IS gloss matches “${item.meaning.split(" / ")[0]}”? (Watch sonastik.ead.ee for help)`,
            nzsl: `Which NZSL gloss matches “${item.meaning.split(" / ")[0]}”? (Watch NZSL Online for help)`,
          },
          `How do you say “${item.meaning.split(" / ")[0]}” in ${lang.name}?`,
        ),
        direction: "from_en",
        accepted: [
          item.term,
          ...item.term.split(" / ").map((s) => s.trim()),
          ...(item.romanization ? [item.romanization] : []),
          ...(item.signasl ? [item.signasl] : []),
          ...(item.signbsl ? [item.signbsl] : []),
          ...(item.sonastik ? [item.sonastik] : []),
          ...(item.nzsl ? [item.nzsl] : []),
        ],
        hint: item.hint || (isSigned ? item.note : item.romanization),
        ...media,
      });
    } else if (i % 5 === 3) {
      exercises.push({
        type: "true_false",
        id: `${languageId}-${unitId}-tf-${i}`,
        prompt: isVideoLang ? "Watch the video — true or false?" : "True or false?",
        statement: `“${item.term}” means “${item.meaning}”.`,
        answer: true,
        explanation: item.hint,
        ...media,
      });
    } else {
      const wrong = distractors[0] || "something else";
      const truth = Math.random() > 0.45;
      exercises.push({
        type: "true_false",
        id: `${languageId}-${unitId}-tf2-${i}`,
        prompt: isVideoLang ? "Watch the video — true or false?" : "True or false?",
        statement: truth
          ? `“${item.term}” means “${item.meaning}”.`
          : `“${item.term}” means “${wrong}”.`,
        answer: truth,
        explanation: `Correct meaning: ${item.meaning}`,
        ...media,
      });
    }
    i++;
  }

  const matchItems = shuffle(pool).slice(0, Math.min(4, pool.length));
  if (matchItems.length >= 3) {
    exercises.push({
      type: "match",
      id: `${languageId}-${unitId}-match`,
      prompt: videoPrompt(
        languageId,
        {
          asl: "Match each ASL gloss with its meaning (open SignASL if you need the video)",
          bsl: "Match each BSL gloss with its meaning (open SignBSL if you need the video)",
          isl: "Match each IS gloss with its meaning (open sonastik.ead.ee if you need the video)",
          nzsl: "Match each NZSL gloss with its meaning (open NZSL Online if you need the video)",
        },
        "Match each term with its meaning",
      ),
      pairs: matchItems.map((m) => ({
        left: m.term,
        right: m.meaning,
        signaslSlug: resolveSignasl(languageId, m),
        signbslSlug: resolveSignbsl(languageId, m),
        sonastikId: resolveSonastik(languageId, m),
        nzslId: resolveNzsl(languageId, m),
      })),
      signaslSlug: resolveSignasl(languageId, matchItems[0]),
      signbslSlug: resolveSignbsl(languageId, matchItems[0]),
      sonastikId: resolveSonastik(languageId, matchItems[0]),
      nzslId: resolveNzsl(languageId, matchItems[0]),
    });
  }

  const fill = shuffle(pool)[0];
  if (fill) {
    const glossLabel = isAsl
      ? "ASL"
      : isBsl
        ? "BSL"
        : isIsl
          ? "IS"
          : isNzsl
            ? "NZSL"
            : null;
    exercises.push({
      type: "fill_blank",
      id: `${languageId}-${unitId}-fill`,
      prompt: videoPrompt(
        languageId,
        {
          asl: "Watch the SignASL video, then fill in the gloss",
          bsl: "Watch the SignBSL video, then fill in the gloss",
          isl: "Watch the International Sign video, then fill in the gloss",
          nzsl: "Watch the NZSL Online video, then fill in the gloss",
        },
        "Fill in the blank",
      ),
      sentence: glossLabel
        ? `The ${glossLabel} gloss for “${fill.meaning.split(" / ")[0]}” is _____.`
        : isSigned
          ? `The concept for “${fill.meaning.split(" / ")[0]}” is _____.`
          : `The ${lang.name} word for “${fill.meaning.split(" / ")[0]}” is _____.`,
      accepted: [
        fill.term,
        ...fill.term.split(" / ").map((s) => s.trim()),
        ...(fill.romanization ? [fill.romanization] : []),
        ...(fill.signasl ? [fill.signasl] : []),
        ...(fill.signbsl ? [fill.signbsl] : []),
        ...(fill.sonastik ? [fill.sonastik] : []),
        ...(fill.nzsl ? [fill.nzsl] : []),
      ],
      hint: fill.hint,
      signaslSlug: resolveSignasl(languageId, fill),
      signbslSlug: resolveSignbsl(languageId, fill),
      sonastikId: resolveSonastik(languageId, fill),
      nzslId: resolveNzsl(languageId, fill),
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
