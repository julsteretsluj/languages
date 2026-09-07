"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { Check, Lock, Play } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useProgress } from "@/components/ProgressProvider";
import { getLanguage } from "@/lib/languages";
import {
  getUnitLessonSpecs,
  isUnitComplete,
} from "@/lib/lessons";
import { getLangProgress } from "@/lib/progress";
import type { LanguageId, UnitId } from "@/lib/types";
import { getUnit, UNITS } from "@/lib/units";

export default function UnitLessonsPage() {
  const params = useParams<{ lang: string; unit: string }>();
  const language = getLanguage(params.lang);
  const unit = getUnit(params.unit);
  const { progress, ready } = useProgress();

  if (!language || !unit) notFound();

  const languageId = language.id as LanguageId;
  const unitId = unit.id as UnitId;
  const lp = ready ? getLangProgress(progress, languageId) : null;
  const completed = lp?.completedLessons ?? [];
  const unitIndex = UNITS.findIndex((u) => u.id === unitId);
  const prevDone =
    unitIndex === 0 ||
    isUnitComplete(languageId, UNITS[unitIndex - 1].id, completed);
  const specs = getUnitLessonSpecs(languageId, unitId);

  if (ready && !prevDone) {
    return (
      <>
        <AppHeader languageId={languageId} backHref={`/learn/${languageId}`} />
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <p className="text-4xl">🔒</p>
          <h1 className="mt-4 text-2xl font-extrabold">Unit locked</h1>
          <p className="mt-2 text-secondary">
            Finish earlier units on your path to unlock {unit.title}.
          </p>
          <Link
            href={`/learn/${languageId}`}
            className="btn-hot mt-6 inline-flex rounded-full px-5 py-2.5 text-sm font-extrabold"
          >
            Back to path
          </Link>
        </main>
      </>
    );
  }

  const doneCount = specs.filter((_, i) =>
    completed.includes(`${languageId}-${unitId}-L${i + 1}`),
  ).length;

  return (
    <>
      <AppHeader languageId={languageId} backHref={`/learn/${languageId}`} />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-20 pt-8">
        <section className="mb-8 text-center">
          <div className="text-4xl">{unit.icon}</div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
            {unit.title}
          </h1>
          <p className="mt-1 text-secondary">{unit.subtitle}</p>
          <p className="mt-4 inline-flex rounded-full bg-primary/15 px-3 py-1 text-sm font-extrabold text-primary">
            {doneCount}/{specs.length} lessons in this unit
          </p>
        </section>

        <ol className="space-y-2">
          {specs.map((spec, i) => {
            const lessonIndex = i + 1;
            const lessonId = `${languageId}-${unitId}-L${lessonIndex}`;
            const done = completed.includes(lessonId);
            const unlocked =
              lessonIndex === 1 ||
              completed.includes(`${languageId}-${unitId}-L${lessonIndex - 1}`) ||
              completed.includes(`${languageId}-${unitId}`);
            const isNext = unlocked && !done;

            const row = (
              <div
                className={`flex items-center gap-3 rounded-[14px] border bg-surface px-4 py-3 shadow-[var(--shadow)] ${
                  unlocked
                    ? "border-border hover:border-primary/50"
                    : "border-transparent opacity-50"
                } ${isNext ? "pulse-next border-primary/50" : ""}`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                    done
                      ? "bg-success text-white"
                      : unlocked
                        ? "bg-[#ffe6f2] text-primary"
                        : "bg-bg text-tertiary"
                  }`}
                >
                  {done ? <Check size={18} /> : unlocked ? lessonIndex : <Lock size={14} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-extrabold tracking-tight">
                    {spec.title}
                  </p>
                  <p className="truncate text-sm text-secondary">{spec.subtitle}</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-tertiary">
                  <span>+{spec.xp} XP</span>
                  {unlocked && !done && <Play size={14} className="text-primary" />}
                </div>
              </div>
            );

            return (
              <li key={lessonId}>
                {unlocked ? (
                  <Link href={`/learn/${languageId}/${unitId}/${lessonIndex}`}>
                    {row}
                  </Link>
                ) : (
                  <div aria-disabled>{row}</div>
                )}
              </li>
            );
          })}
        </ol>
      </main>
    </>
  );
}
