"use client";

import { useEffect } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { Check, Lock, Star } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useProgress } from "@/components/ProgressProvider";
import { getLanguage } from "@/lib/languages";
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

  const completed = new Set(lp?.completedLessons ?? []);
  let nextIndex = UNITS.findIndex((u) => !completed.has(`${languageId}-${u.id}`));
  if (nextIndex < 0) nextIndex = UNITS.length - 1;

  return (
    <>
      <AppHeader languageId={languageId} backHref="/" />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-20 pt-8">
        <section className="animate-fade-up mb-8 text-center">
          <div className="text-5xl">{language.flag}</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{language.name}</h1>
          <p className="mt-1 text-secondary">{language.nativeName}</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-secondary">
            {language.description}
          </p>
          {lp && lp.hearts === 0 && (
            <button
              type="button"
              onClick={() => resetHearts(languageId)}
              className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
            >
              Refill hearts to continue
            </button>
          )}
        </section>

        <ol className="relative space-y-3">
          <div className="absolute bottom-4 left-[27px] top-4 w-0.5 bg-border" aria-hidden />
          {UNITS.map((unit, index) => {
            const lessonId = `${languageId}-${unit.id}`;
            const done = completed.has(lessonId);
            const unlocked = index === 0 || completed.has(`${languageId}-${UNITS[index - 1].id}`);
            const isNext = index === nextIndex && unlocked && !done;
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
                    done
                      ? "bg-success text-white"
                      : unlocked
                        ? "bg-bg"
                        : "bg-bg text-tertiary"
                  }`}
                  style={
                    unlocked && !done
                      ? { boxShadow: `inset 0 0 0 3px ${unit.color}` }
                      : undefined
                  }
                >
                  {done ? <Check size={22} /> : unlocked ? unit.icon : <Lock size={18} />}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold tracking-tight">{unit.title}</h2>
                    {done && (
                      <span className="inline-flex text-warning">
                        {Array.from({ length: stars || 2 }).map((_, i) => (
                          <Star key={i} size={12} fill="currentColor" />
                        ))}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-secondary">{unit.subtitle}</p>
                  {isNext && (
                    <p className="mt-1 text-xs font-medium text-primary">Continue here</p>
                  )}
                </div>
                <span className="text-xs text-tertiary">+15 XP</span>
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
