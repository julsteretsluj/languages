"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { LessonPlayer } from "@/components/LessonPlayer";
import { useProgress } from "@/components/ProgressProvider";
import { getLanguage } from "@/lib/languages";
import {
  getLesson,
  getUnitLessonCount,
  isUnitComplete,
} from "@/lib/lessons";
import { getLangProgress } from "@/lib/progress";
import type { LanguageId, UnitId } from "@/lib/types";
import { getUnit, getUnitsForLanguage, isUnitForLanguage } from "@/lib/units";

export default function LessonPlayPage() {
  const params = useParams<{ lang: string; unit: string; lesson: string }>();
  const router = useRouter();
  const language = getLanguage(params.lang);
  const unit = getUnit(params.unit);
  const lessonIndex = Number(params.lesson);
  const { progress, ready, finishLesson, missHeart, resetHearts } = useProgress();
  const [seed] = useState(() => Date.now());

  const languageId = (language?.id ?? "asl") as LanguageId;
  const unitId = (unit?.id ?? "grammar") as UnitId;

  const lesson = useMemo(
    () =>
      language && unit && Number.isFinite(lessonIndex) && lessonIndex >= 1
        ? getLesson(languageId, unitId, lessonIndex)
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [languageId, unitId, lessonIndex, seed],
  );

  if (!language || !unit || !Number.isFinite(lessonIndex) || lessonIndex < 1) {
    notFound();
  }
  if (!isUnitForLanguage(unitId, languageId)) notFound();

  const units = getUnitsForLanguage(languageId);
  const lp = ready ? getLangProgress(progress, languageId) : null;
  const completed = lp?.completedLessons ?? [];
  const lessonCount = getUnitLessonCount(languageId, unitId);

  if (lessonIndex > lessonCount || !lesson) notFound();

  const unitIndex = units.findIndex((u) => u.id === unitId);
  const prevUnitDone =
    unitIndex === 0 ||
    isUnitComplete(languageId, units[unitIndex - 1].id, completed);
  const prevLessonDone =
    lessonIndex === 1 ||
    completed.includes(`${languageId}-${unitId}-L${lessonIndex - 1}`) ||
    completed.includes(`${languageId}-${unitId}`);

  if (ready && (!prevUnitDone || !prevLessonDone)) {
    return (
      <>
        <AppHeader
          languageId={languageId}
          backHref={`/learn/${languageId}/${unitId}`}
        />
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <p className="text-4xl">🔒</p>
          <h1 className="mt-4 text-2xl font-extrabold">Lesson locked</h1>
          <p className="mt-2 text-secondary">
            Finish the previous lesson to unlock this one.
          </p>
          <Link
            href={`/learn/${languageId}/${unitId}`}
            className="btn-hot mt-6 inline-flex rounded-full px-5 py-2.5 text-sm font-extrabold"
          >
            Back to unit
          </Link>
        </main>
      </>
    );
  }

  if (ready && lp && lp.hearts <= 0) {
    return (
      <>
        <AppHeader
          languageId={languageId}
          backHref={`/learn/${languageId}/${unitId}`}
        />
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <p className="text-4xl">💔</p>
          <h1 className="mt-4 text-2xl font-extrabold">Out of hearts</h1>
          <p className="mt-2 text-secondary">
            Take a breath, refill, and try the lesson again.
          </p>
          <button
            type="button"
            onClick={() => resetHearts(languageId)}
            className="btn-hot mt-6 rounded-full px-5 py-2.5 text-sm font-extrabold"
          >
            Refill hearts
          </button>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader
        languageId={languageId}
        backHref={`/learn/${languageId}/${unitId}`}
        title={`${unit.title} · ${lessonIndex}/${lessonCount}`}
      />
      <LessonPlayer
        lesson={lesson}
        unitIcon={unit.icon}
        accent={language.accent}
        onMiss={() => missHeart(languageId)}
        onComplete={(earnedXp, perfect) => {
          finishLesson(languageId, lesson.id, unitId, earnedXp, perfect);
          const next = lessonIndex + 1;
          if (next <= lessonCount) {
            router.push(`/learn/${languageId}/${unitId}/${next}`);
          } else {
            router.push(`/learn/${languageId}/${unitId}`);
          }
        }}
      />
    </>
  );
}
