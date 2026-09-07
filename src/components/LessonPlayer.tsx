"use client";

import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { answersMatch } from "@/lib/lessons";
import type { Exercise, Lesson } from "@/lib/types";

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
          <button
            type="button"
            onClick={() => onComplete(xp, perfect)}
            className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
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
          style={{ width: `${progress}%`, background: accent === "#000000" ? "#007AFF" : accent }}
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
          <button
            type="button"
            onClick={continueNext}
            className="mt-3 w-full rounded-full bg-primary py-3 text-sm font-medium text-white"
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
  if (exercise.type === "multiple_choice") {
    return (
      <div>
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
      <TextAnswer
        prompt={exercise.prompt}
        sentence={exercise.type === "fill_blank" ? exercise.sentence : undefined}
        hint={exercise.hint}
        accepted={exercise.accepted}
        disabled={disabled}
        onAnswer={onAnswer}
      />
    );
  }

  if (exercise.type === "true_false") {
    return (
      <div>
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

  return (
    <MatchExercise
      exercise={exercise}
      disabled={disabled}
      onAnswer={onAnswer}
    />
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
        className="mt-4 w-full rounded-full bg-primary py-3 text-sm font-medium text-white disabled:opacity-40"
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
                onClick={() => setSelectedLeft(p.left)}
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
        Tap a term, then its meaning.
      </p>
    </div>
  );
}
