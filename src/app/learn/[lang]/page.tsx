"use client";

import { useEffect } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { Check, Lock, Star } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useProgress } from "@/components/ProgressProvider";
import { CEFR_LEVELS, CEFR_META, cefrLabelForModality } from "@/lib/cefr";
import { getLanguage } from "@/lib/languages";
import {
  getNextLessonRef,
  getTotalLessonCount,
  getUnitLessonCount,
  isUnitComplete,
} from "@/lib/lessons";
import { getLangProgress } from "@/lib/progress";
import type { LanguageId } from "@/lib/types";
import { UNITS } from "@/lib/units";

export default function LearnPathPage() {
  const params = useParams<{ lang: string }>();
  const language = getLanguage(params.lang);
  const { progress, ready, chooseLanguage, resetHearts } = useProgress();

  useEffect(() => {
    if (ready && language && progress.selectedLanguage !== language.id) {
      chooseLanguage(language.id as LanguageId);
    }
  }, [ready, language, progress.selectedLanguage, chooseLanguage]);

  if (!language) notFound();

  const languageId = language.id as LanguageId;
  const lp = ready ? getLangProgress(progress, languageId) : null;
  const completed = lp?.completedLessons ?? [];
  const totalLessons = getTotalLessonCount(languageId);
  const doneLessons = completed.filter((id) =>
    id.startsWith(`${languageId}-`),
  ).length;
  const next = getNextLessonRef(languageId, completed);

  return (
    <>
      <AppHeader languageId={languageId} backHref="/" />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-20 pt-8">
        <section className="animate-fade-up mb-8 text-center">
          <div className="text-5xl">{language.flag}</div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
            {language.name}
          </h1>
          <p className="mt-1 font-semibold text-secondary">{language.nativeName}</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-secondary">
            {language.description}
          </p>
          <p className="mt-4 inline-flex rounded-full bg-primary/15 px-3 py-1 text-sm font-extrabold text-primary">
            {doneLessons}/{totalLessons} lessons · path to C2
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {CEFR_LEVELS.map((level) => {
              const unitsAtLevel = UNITS.filter((u) => u.cefr === level);
              const doneAtLevel = unitsAtLevel.filter((u) =>
                isUnitComplete(languageId, u.id, completed),
              ).length;
              const meta = CEFR_META[level];
              const filled = doneAtLevel === unitsAtLevel.length && unitsAtLevel.length > 0;
              return (
                <span
                  key={level}
                  className="rounded-full px-2.5 py-1 text-xs font-extrabold"
                  style={{
                    background: filled ? meta.color : `${meta.color}22`,
                    color: filled ? "#fff" : meta.color,
                  }}
                  title={`${cefrLabelForModality(level, language.modality)} — ${meta.blurb}`}
                >
                  {cefrLabelForModality(level, language.modality)}
                  {unitsAtLevel.length > 0 ? ` ${doneAtLevel}/${unitsAtLevel.length}` : ""}
                </span>
              );
            })}
          </div>
          {languageId === "asl" && (
            <p className="mt-3 text-sm text-secondary">
              Sign videos from{" "}
              <a
                href="https://www.signasl.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                SignASL.org
              </a>
            </p>
          )}
          {languageId === "bsl" && (
            <p className="mt-3 text-sm text-secondary">
              Sign videos from{" "}
              <a
                href="https://www.signbsl.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                SignBSL.com
              </a>
            </p>
          )}
          {languageId === "isl" && (
            <p className="mt-3 text-sm text-secondary">
              Sign videos from{" "}
              <a
                href="https://sonastik.ead.ee/embed/en/word-list"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                sonastik.ead.ee
              </a>
            </p>
          )}
          {languageId === "nzsl" && (
            <p className="mt-3 text-sm text-secondary">
              Sign videos from{" "}
              <a
                href="https://www.nzsl.nz/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                NZSL.nz
              </a>
            </p>
          )}
          {lp && lp.hearts === 0 && (
            <button
              type="button"
              onClick={() => resetHearts(languageId)}
              className="btn-hot mt-4 rounded-full px-5 py-2.5 text-sm font-extrabold"
            >
              Refill hearts to continue
            </button>
          )}
        </section>

        <ol className="relative space-y-3">
          <div
            className="absolute bottom-4 left-[27px] top-4 w-0.5 bg-border"
            aria-hidden
          />
          {UNITS.map((unit, index) => {
            const lessonCount = getUnitLessonCount(languageId, unit.id);
            const unitDone = isUnitComplete(languageId, unit.id, completed);
            const prevDone =
              index === 0 ||
              isUnitComplete(languageId, UNITS[index - 1].id, completed);
            const unlocked = prevDone;
            const doneInUnit = Array.from({ length: lessonCount }).filter(
              (_, i) =>
                completed.includes(`${languageId}-${unit.id}-L${i + 1}`) ||
                completed.includes(`${languageId}-${unit.id}`),
            ).length;
            const isNext = next?.unitId === unit.id && unlocked && !unitDone;
            const stars = lp?.unitStars[unit.id] ?? 0;

            const inner = (
              <div
                className={`relative flex items-center gap-4 rounded-[16px] border bg-surface p-4 shadow-[var(--shadow)] transition-colors ${
                  unlocked
                    ? "border-border hover:border-primary/40"
                    : "border-transparent opacity-55"
                } ${isNext ? "pulse-next border-primary/50" : ""}`}
              >
                <div
                  className={`relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl ${
                    unitDone
                      ? "bg-success text-white"
                      : unlocked
                        ? "bg-bg"
                        : "bg-bg text-tertiary"
                  }`}
                  style={
                    unlocked && !unitDone
                      ? { boxShadow: `inset 0 0 0 3px ${unit.color}` }
                      : undefined
                  }
                >
                  {unitDone ? (
                    <Check size={22} />
                  ) : unlocked ? (
                    unit.icon
                  ) : (
                    <Lock size={18} />
                  )}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <h2 className="font-extrabold tracking-tight">{unit.title}</h2>
                    {unitDone && (
                      <span className="inline-flex text-warning">
                        {Array.from({ length: stars || 2 }).map((_, i) => (
                          <Star key={i} size={12} fill="currentColor" />
                        ))}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-secondary">{unit.subtitle}</p>
                  <p className="mt-1 text-xs font-semibold text-tertiary">
                    {Math.min(doneInUnit, lessonCount)}/{lessonCount} lessons · to C2
                  </p>
                  {isNext && (
                    <p className="mt-1 text-xs font-extrabold text-primary">
                      Continue here
                    </p>
                  )}
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-extrabold text-white"
                  style={{ background: CEFR_META[unit.cefr].color }}
                >
                  {unit.cefr}+
                </span>
              </div>
            );

            return (
              <li
                key={unit.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
              >
                {unlocked ? (
                  <Link href={`/learn/${languageId}/${unit.id}`}>{inner}</Link>
                ) : (
                  <div aria-disabled>{inner}</div>
                )}
              </li>
            );
          })}
        </ol>
      </main>
    </>
  );
}
