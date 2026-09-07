"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { LessonPlayer } from "@/components/LessonPlayer";
import { useProgress } from "@/components/ProgressProvider";
import { getLanguage } from "@/lib/languages";
import { getLesson } from "@/lib/lessons";
import { getLangProgress } from "@/lib/progress";
import type { LanguageId, UnitId } from "@/lib/types";
import { getUnit, UNITS } from "@/lib/units";

export default function LessonPage() {
  const params = useParams<{ lang: string; unit: string }>();
  const router = useRouter();
  const language = getLanguage(params.lang);
  const unit = getUnit(params.unit);
  const { progress, ready, finishLesson, missHeart, resetHearts } = useProgress();
  const [seed] = useState(() => Date.now());

  if (!language || !unit) notFound();

  const languageId = language.id as LanguageId;
  const unitId = unit.id as UnitId;
  const lp = ready ? getLangProgress(progress, languageId) : null;

  const unitIndex = UNITS.findIndex((u) => u.id === unitId);
  const prevDone =
    unitIndex === 0 ||
    (lp?.completedLessons.includes(`${languageId}-${UNITS[unitIndex - 1].id}`) ??
      false);

  const lesson = useMemo(
    () => getLesson(languageId, unitId),
    // re-roll exercises when remounting
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [languageId, unitId, seed],
  );

  if (ready && !prevDone) {
    return (
      <>
        <AppHeader languageId={languageId} backHref={`/learn/${languageId}`} />
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <p className="text-4xl">🔒</p>
          <h1 className="mt-4 text-2xl font-semibold">Unit locked</h1>
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

  if (ready && lp && lp.hearts <= 0) {
    return (
      <>
        <AppHeader languageId={languageId} backHref={`/learn/${languageId}`} />
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <p className="text-4xl">💔</p>
          <h1 className="mt-4 text-2xl font-semibold">Out of hearts</h1>
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
        backHref={`/learn/${languageId}`}
        title={unit.title}
      />
      <LessonPlayer
        lesson={lesson}
        unitIcon={unit.icon}
        accent={language.accent}
        onMiss={() => missHeart(languageId)}
        onComplete={(earnedXp, perfect) => {
          finishLesson(languageId, lesson.id, unitId, earnedXp, perfect);
          router.push(`/learn/${languageId}`);
        }}
      />
    </>
  );
}
