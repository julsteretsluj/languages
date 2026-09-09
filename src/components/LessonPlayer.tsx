"use client";

import { useMemo, useState } from "react";
import { Check, ExternalLink, X } from "lucide-react";
import { SignDictionaryVideo } from "@/components/SignDictionaryVideo";
import { answersMatch } from "@/lib/lessons";
import { signaslDictionaryUrl } from "@/lib/signasl";
import { signbslDictionaryUrl } from "@/lib/signbsl";
import { SONASTIK_WORD_LIST, sonastikDictionaryUrl } from "@/lib/sonastik";
import { NZSL_ORIGIN, nzslDictionaryUrl } from "@/lib/nzsl";
import type { Exercise, Lesson } from "@/lib/types";

function exerciseVideo(exercise: Exercise) {
  if (exercise.signaslSlug) {
    return <SignDictionaryVideo provider="asl" word={exercise.signaslSlug} />;
  }
  if (exercise.signbslSlug) {
    return <SignDictionaryVideo provider="bsl" word={exercise.signbslSlug} />;
  }
  if (exercise.sonastikId) {
    return <SignDictionaryVideo provider="isl" word={exercise.sonastikId} />;
  }
  if (exercise.nzslId) {
    return <SignDictionaryVideo provider="nzsl" word={exercise.nzslId} />;
  }
  return null;
}

function reviewLink(exercise: Exercise) {
  if (exercise.signaslSlug) {
    return {
      href: signaslDictionaryUrl(exercise.signaslSlug),
      label: "Review on SignASL.org",
    };
  }
  if (exercise.signbslSlug) {
    return {
      href: signbslDictionaryUrl(exercise.signbslSlug),
      label: "Review on SignBSL.com",
    };
  }
  if (exercise.sonastikId) {
    return {
      href: sonastikDictionaryUrl(exercise.sonastikId),
      label: "Review on sonastik.ead.ee",
    };
  }
  if (exercise.nzslId) {
    return {
      href: nzslDictionaryUrl(exercise.nzslId),
      label: "Review on NZSL.nz",
    };
  }
  return null;
}

export function LessonPlayer({
  lesson,
  unitIcon,
  accent,
  onMiss,
  onComplete,
}: {
  lesson: Lesson;
  unitIcon: string;
  accent: string;
  onMiss: () => void;
  onComplete: (xp: number, perfect: boolean) => void;
}) {
  const [index, setIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [finished, setFinished] = useState(false);
  const exercise = lesson.exercises[index];
  const progress = ((index + (feedback ? 1 : 0)) / lesson.exercises.length) * 100;

  function advance(correct: boolean) {
    if (!correct) {
      setMistakes((m) => m + 1);
      onMiss();
      setFeedback("wrong");
      return;
    }
    setFeedback("correct");
  }

  function continueNext() {
    setFeedback(null);
    if (index + 1 >= lesson.exercises.length) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
  }

  if (finished) {
    const perfect = mistakes === 0;
    const xp = perfect ? lesson.xp + 5 : Math.max(5, lesson.xp - mistakes * 2);
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        <div className="animate-pop rounded-[20px] bg-surface p-8 shadow-[var(--shadow)]">
          <div className="text-5xl">{perfect ? "🏆" : unitIcon}</div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            {perfect ? "Perfect lesson!" : "Lesson complete"}
          </h1>
          <p className="mt-2 text-secondary">
            You earned <span className="font-semibold text-primary">+{xp} XP</span>
            {mistakes > 0 ? ` · ${mistakes} miss${mistakes === 1 ? "" : "es"}` : ""}.
          </p>
          {lesson.languageId === "asl" && (
            <p className="mt-3 text-xs text-tertiary">
              ASL videos referenced from{" "}
              <a
                href="https://www.signasl.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                SignASL.org
              </a>
            </p>
          )}
          {lesson.languageId === "bsl" && (
            <p className="mt-3 text-xs text-tertiary">
              BSL videos referenced from{" "}
              <a
                href="https://www.signbsl.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                SignBSL.com
              </a>
            </p>
          )}
          {lesson.languageId === "isl" && (
            <p className="mt-3 text-xs text-tertiary">
              International Sign videos from{" "}
              <a
                href={SONASTIK_WORD_LIST}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                sonastik.ead.ee
              </a>
            </p>
          )}
          {lesson.languageId === "nzsl" && (
            <p className="mt-3 text-xs text-tertiary">
              NZSL videos from{" "}
              <a
                href={NZSL_ORIGIN}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                NZSL.nz
              </a>
            </p>
          )}
          <button
            type="button"
            onClick={() => onComplete(xp, perfect)}
            className="btn-hot mt-6 rounded-full px-6 py-3 text-sm font-extrabold"
          >
            Continue path
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-8 pt-4">
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-border/60">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            background: accent === "#000000" ? "#ff2d95" : accent,
          }}
        />
      </div>

      <div className="animate-fade-up flex-1 rounded-[20px] bg-surface p-5 shadow-[var(--shadow)] sm:p-7">
        <p className="text-sm font-medium text-secondary">
          {index + 1} / {lesson.exercises.length}
        </p>
        <ExerciseView
          key={exercise.id}
          exercise={exercise}
          disabled={feedback !== null}
          onAnswer={advance}
        />
      </div>

      {feedback && (
        <div
          className={`animate-pop mt-4 rounded-[16px] border p-4 ${
            feedback === "correct"
              ? "border-success/30 bg-[#34c75914]"
              : "border-danger/30 bg-[#ff3b3014]"
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {feedback === "correct" ? (
              <>
                <Check className="text-success" size={18} /> Correct
              </>
            ) : (
              <>
                <X className="text-danger" size={18} /> Not quite
              </>
            )}
          </div>
          {feedback === "wrong" && exercise.type === "arrange" && (
            <p className="mt-2 text-sm text-secondary">
              Correct order:{" "}
              <span className="font-extrabold text-ink">
                {exercise.answer.join(" · ")}
              </span>
              <span className="mt-1 block text-tertiary">{exercise.rule}</span>
            </p>
          )}
          {feedback === "wrong" &&
            exercise.type !== "arrange" &&
            "explanation" in exercise &&
            exercise.explanation && (
              <p className="mt-2 text-sm text-secondary">{exercise.explanation}</p>
            )}
          {(() => {
            const link = reviewLink(exercise);
            return link ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                {link.label} <ExternalLink size={12} />
              </a>
            ) : null;
          })()}
          <button
            type="button"
            onClick={continueNext}
            className="btn-hot mt-3 w-full rounded-full py-3 text-sm font-extrabold"
          >
            Continue
          </button>
        </div>
      )}
    </main>
  );
}

function ExerciseView({
  exercise,
  disabled,
  onAnswer,
}: {
  exercise: Exercise;
  disabled: boolean;
  onAnswer: (correct: boolean) => void;
}) {
  const video = exerciseVideo(exercise);

  if (exercise.type === "multiple_choice") {
    return (
      <div>
        {video}
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{exercise.prompt}</h2>
        <div className="mt-6 grid gap-2">
          {exercise.options.map((opt) => (
            <button
              key={opt}
              type="button"
              disabled={disabled}
              onClick={() => onAnswer(opt === exercise.answer)}
              className="rounded-[12px] border border-border bg-bg px-4 py-3.5 text-left transition-colors hover:border-primary/50 disabled:opacity-60"
            >
              {opt}
            </button>
          ))}
        </div>
        {exercise.explanation && (
          <p className="mt-4 text-sm text-tertiary">Hint: {exercise.explanation}</p>
        )}
      </div>
    );
  }

  if (exercise.type === "translate" || exercise.type === "fill_blank") {
    return (
      <div>
        {video}
        <TextAnswer
          prompt={exercise.prompt}
          sentence={exercise.type === "fill_blank" ? exercise.sentence : undefined}
          hint={exercise.hint}
          accepted={exercise.accepted}
          disabled={disabled}
          onAnswer={onAnswer}
        />
      </div>
    );
  }

  if (exercise.type === "true_false") {
    return (
      <div>
        {video}
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{exercise.prompt}</h2>
        <p className="mt-4 rounded-[12px] bg-bg p-4 text-lg leading-relaxed">
          {exercise.statement}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onAnswer(exercise.answer === true)}
            className="rounded-[12px] border border-border bg-bg py-3.5 font-medium hover:border-success/50"
          >
            True
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onAnswer(exercise.answer === false)}
            className="rounded-[12px] border border-border bg-bg py-3.5 font-medium hover:border-danger/50"
          >
            False
          </button>
        </div>
      </div>
    );
  }

  if (exercise.type === "arrange") {
    return (
      <ArrangeExerciseView
        exercise={exercise}
        disabled={disabled}
        onAnswer={onAnswer}
      />
    );
  }

  return (
    <MatchExercise exercise={exercise} disabled={disabled} onAnswer={onAnswer} />
  );
}

function ArrangeExerciseView({
  exercise,
  disabled,
  onAnswer,
}: {
  exercise: Extract<Exercise, { type: "arrange" }>;
  disabled: boolean;
  onAnswer: (correct: boolean) => void;
}) {
  const [bank, setBank] = useState(() =>
    exercise.tokens.map((text, i) => ({ id: `${i}-${text}`, text })),
  );
  const [built, setBuilt] = useState<{ id: string; text: string }[]>([]);
  const [preview, setPreview] = useState<string | null>(() => {
    if (exercise.videoProvider && exercise.tokenKeys?.length) {
      return exercise.tokenKeys[0] ?? null;
    }
    return null;
  });

  function keyForToken(text: string): string | null {
    if (!exercise.tokenKeys?.length) return null;
    const idx = exercise.answer.findIndex((t) => t === text);
    if (idx >= 0) return exercise.tokenKeys[idx] ?? null;
    // Fallback: slugify the gloss itself
    return text.toLowerCase().replace(/[^a-z0-9-]/g, "");
  }

  function pick(id: string) {
    if (disabled) return;
    const chip = bank.find((c) => c.id === id);
    if (!chip) return;
    const key = keyForToken(chip.text);
    if (key && exercise.videoProvider) setPreview(key);
    setBank((b) => b.filter((c) => c.id !== id));
    setBuilt((b) => [...b, chip]);
  }

  function unpick(id: string) {
    if (disabled) return;
    const chip = built.find((c) => c.id === id);
    if (!chip) return;
    const key = keyForToken(chip.text);
    if (key && exercise.videoProvider) setPreview(key);
    setBuilt((b) => b.filter((c) => c.id !== id));
    setBank((b) => [...b, chip]);
  }

  function check() {
    const ok =
      built.length === exercise.answer.length &&
      built.every((c, i) => c.text === exercise.answer[i]);
    onAnswer(ok);
  }

  return (
    <div>
      <p className="inline-flex rounded-full bg-primary/15 px-2.5 py-1 text-xs font-extrabold text-primary">
        {exercise.pattern}
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight">{exercise.prompt}</h2>
      <p className="mt-2 text-sm leading-relaxed text-secondary">{exercise.rule}</p>
      <p className="mt-3 rounded-[12px] bg-bg px-3 py-2 text-sm font-semibold text-secondary">
        Meaning: <span className="text-ink">{exercise.english}</span>
      </p>

      {exercise.videoProvider && exercise.tokenKeys && (
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-tertiary">
            Watch each gloss (one sign each)
          </p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {exercise.answer.map((gloss, i) => {
              const key = exercise.tokenKeys![i];
              const active = preview === key;
              return (
                <button
                  key={`${gloss}-${i}`}
                  type="button"
                  disabled={disabled}
                  onClick={() => setPreview(key)}
                  className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${
                    active
                      ? "bg-primary text-white"
                      : "border border-border bg-bg text-secondary hover:border-primary/50"
                  }`}
                >
                  {gloss}
                </button>
              );
            })}
          </div>
          {preview && (
            <SignDictionaryVideo
              key={preview}
              provider={exercise.videoProvider}
              word={preview}
            />
          )}
        </div>
      )}

      <div className="mt-5 min-h-[56px] rounded-[14px] border-2 border-dashed border-border bg-[#fff7fb] p-3">
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-tertiary">
          Your sentence
        </p>
        <div className="flex flex-wrap gap-2">
          {built.length === 0 && (
            <span className="text-sm text-tertiary">
              Tap glosses below to build the order
            </span>
          )}
          {built.map((chip) => (
            <button
              key={chip.id}
              type="button"
              disabled={disabled}
              onClick={() => unpick(chip.id)}
              className="rounded-full bg-primary px-3 py-1.5 text-sm font-extrabold text-white"
            >
              {chip.text}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {bank.map((chip) => (
          <button
            key={chip.id}
            type="button"
            disabled={disabled}
            onClick={() => pick(chip.id)}
            className="rounded-full border border-border bg-bg px-3 py-1.5 text-sm font-extrabold hover:border-primary/50"
          >
            {chip.text}
          </button>
        ))}
      </div>

      {exercise.explanation && (
        <p className="mt-3 text-sm text-tertiary">Note: {exercise.explanation}</p>
      )}

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          disabled={disabled || built.length === 0}
          onClick={() => {
            setBank(exercise.tokens.map((text, i) => ({ id: `${i}-${text}`, text })));
            setBuilt([]);
            if (exercise.tokenKeys?.[0]) setPreview(exercise.tokenKeys[0]);
          }}
          className="rounded-full border border-border px-4 py-2.5 text-sm font-extrabold text-secondary hover:border-primary hover:text-primary disabled:opacity-50"
        >
          Reset
        </button>
        <button
          type="button"
          disabled={disabled || built.length !== exercise.answer.length}
          onClick={check}
          className="btn-hot flex-1 rounded-full py-2.5 text-sm font-extrabold disabled:opacity-50"
        >
          Check order
        </button>
      </div>
    </div>
  );
}

function TextAnswer({
  prompt,
  sentence,
  hint,
  accepted,
  disabled,
  onAnswer,
}: {
  prompt: string;
  sentence?: string;
  hint?: string;
  accepted: string[];
  disabled: boolean;
  onAnswer: (correct: boolean) => void;
}) {
  const [value, setValue] = useState("");

  return (
    <div>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">{prompt}</h2>
      {sentence && (
        <p className="mt-4 rounded-[12px] bg-bg p-4 text-lg leading-relaxed">
          {sentence}
        </p>
      )}
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) {
            onAnswer(answersMatch(value, accepted));
          }
        }}
        placeholder="Type your answer"
        className="mt-6 w-full rounded-[12px] border border-border bg-bg px-4 py-3.5 outline-none ring-primary focus:ring-2"
        autoFocus
      />
      {hint && <p className="mt-2 text-sm text-tertiary">Hint: {hint}</p>}
      <button
        type="button"
        disabled={disabled || !value.trim()}
        onClick={() => onAnswer(answersMatch(value, accepted))}
        className="btn-hot mt-4 w-full rounded-full py-3 text-sm font-extrabold disabled:opacity-40"
      >
        Check
      </button>
    </div>
  );
}

function MatchExercise({
  exercise,
  disabled,
  onAnswer,
}: {
  exercise: Extract<Exercise, { type: "match" }>;
  disabled: boolean;
  onAnswer: (correct: boolean) => void;
}) {
  const rights = useMemo(
    () => [...exercise.pairs.map((p) => p.right)].sort(() => Math.random() - 0.5),
    [exercise.pairs],
  );
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<Record<string, string>>({});
  const [wrongPair, setWrongPair] = useState<string | null>(null);
  const hasVideo = exercise.pairs.some(
    (p) => p.signaslSlug || p.signbslSlug || p.sonastikId || p.nzslId,
  );
  const [preview, setPreview] = useState<{
    provider: "asl" | "bsl" | "isl" | "nzsl";
    slug: string;
  } | null>(() => {
    const first = exercise.pairs[0];
    if (first?.signaslSlug) return { provider: "asl", slug: first.signaslSlug };
    if (first?.signbslSlug) return { provider: "bsl", slug: first.signbslSlug };
    if (first?.sonastikId) return { provider: "isl", slug: first.sonastikId };
    if (first?.nzslId) return { provider: "nzsl", slug: first.nzslId };
    return null;
  });

  function pickRight(right: string) {
    if (!selectedLeft || disabled) return;
    const expected = exercise.pairs.find((p) => p.left === selectedLeft)?.right;
    if (expected === right) {
      const next = { ...matched, [selectedLeft]: right };
      setMatched(next);
      setSelectedLeft(null);
      setWrongPair(null);
      if (Object.keys(next).length === exercise.pairs.length) {
        onAnswer(true);
      }
    } else {
      setWrongPair(right);
      setTimeout(() => setWrongPair(null), 450);
    }
  }

  const usedRights = new Set(Object.values(matched));

  return (
    <div>
      {preview && (
        <SignDictionaryVideo provider={preview.provider} word={preview.slug} />
      )}
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">{exercise.prompt}</h2>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {exercise.pairs.map((p) => {
            const done = Boolean(matched[p.left]);
            return (
              <button
                key={p.left}
                type="button"
                disabled={disabled || done}
                onClick={() => {
                  setSelectedLeft(p.left);
                  if (p.signaslSlug) {
                    setPreview({ provider: "asl", slug: p.signaslSlug });
                  } else if (p.signbslSlug) {
                    setPreview({ provider: "bsl", slug: p.signbslSlug });
                  } else if (p.sonastikId) {
                    setPreview({ provider: "isl", slug: p.sonastikId });
                  } else if (p.nzslId) {
                    setPreview({ provider: "nzsl", slug: p.nzslId });
                  }
                }}
                className={`w-full rounded-[12px] border px-3 py-3 text-left text-sm transition-colors ${
                  done
                    ? "border-success/40 bg-[#34c75914] text-secondary"
                    : selectedLeft === p.left
                      ? "border-primary bg-[#007aff14]"
                      : "border-border bg-bg"
                }`}
              >
                {p.left}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          {rights.map((right) => {
            const used = usedRights.has(right);
            return (
              <button
                key={right}
                type="button"
                disabled={disabled || used || !selectedLeft}
                onClick={() => pickRight(right)}
                className={`w-full rounded-[12px] border px-3 py-3 text-left text-sm transition-colors ${
                  used
                    ? "border-success/40 bg-[#34c75914] text-secondary"
                    : wrongPair === right
                      ? "border-danger bg-[#ff3b3014]"
                      : "border-border bg-bg"
                }`}
              >
                {right}
              </button>
            );
          })}
        </div>
      </div>
      <p className="mt-3 text-sm text-tertiary">
        {hasVideo
          ? "Tap a gloss to preview its dictionary video, then match the meaning."
          : "Tap a term, then its meaning."}
      </p>
    </div>
  );
}
