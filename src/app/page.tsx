"use client";

import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { useProgress } from "@/components/ProgressProvider";
import { LANGUAGES } from "@/lib/languages";
import { getLangProgress } from "@/lib/progress";
import { UNITS } from "@/lib/units";
import type { LanguageId } from "@/lib/types";

export default function HomePage() {
  const { progress, ready, chooseLanguage } = useProgress();

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-8">
        <section className="animate-fade-up relative overflow-hidden rounded-[20px] bg-surface px-6 py-10 shadow-[var(--shadow)] sm:px-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 100% 0%, rgba(0,122,255,0.12), transparent 55%), radial-gradient(ellipse 60% 50% at 0% 100%, rgba(52,199,89,0.1), transparent 50%)",
            }}
          />
          <div className="relative max-w-xl">
            <p className="text-sm font-medium text-primary">Lingora</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              Learn to speak — and sign.
            </h1>
            <p className="mt-3 text-[17px] leading-relaxed text-secondary">
              A calm path through grammar, everyday life, culture, and conversation
              across nine languages, including four signed languages.
            </p>
            <p className="mt-4 text-sm text-tertiary">
              {UNITS.length} units · {LANGUAGES.length} languages · XP, streaks & hearts
            </p>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Choose a language</h2>
              <p className="mt-1 text-secondary">
                Start anywhere. Progress is saved on this device.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LANGUAGES.map((lang, index) => {
              const lp = ready ? getLangProgress(progress, lang.id) : null;
              const done = lp?.completedLessons.length ?? 0;
              const pct = Math.round((done / UNITS.length) * 100);

              return (
                <Link
                  key={lang.id}
                  href={`/learn/${lang.id}`}
                  onClick={() => chooseLanguage(lang.id as LanguageId)}
                  className="animate-fade-up group rounded-[16px] border border-border bg-surface p-5 shadow-[var(--shadow)] transition-colors hover:border-primary/40"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-3xl">{lang.flag}</div>
                      <h3 className="mt-3 text-lg font-semibold tracking-tight group-hover:text-primary">
                        {lang.name}
                      </h3>
                      <p className="text-sm text-secondary">{lang.nativeName}</p>
                    </div>
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{
                        background: `${lang.accent}18`,
                        color: lang.accent === "#000000" ? "#1d1d1f" : lang.accent,
                      }}
                    >
                      {lang.modality === "signed" ? "Signed" : "Spoken"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-secondary">
                    {lang.description}
                  </p>
                  {ready && (
                    <div className="mt-4">
                      <div className="mb-1 flex justify-between text-xs text-tertiary">
                        <span>
                          {done}/{UNITS.length} units
                        </span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-bg">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {lp && lp.xp > 0 && (
                        <p className="mt-2 text-xs text-secondary">
                          {lp.xp} XP · {lp.streak} day streak
                        </p>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-12 rounded-[16px] border border-border bg-surface p-6 sm:p-8">
          <h2 className="text-xl font-semibold tracking-tight">Your learning path</h2>
          <p className="mt-1 max-w-2xl text-secondary">
            Every language follows the same unit order — foundations first, then daily
            life, society, and expressive skills.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {UNITS.map((unit) => (
              <span
                key={unit.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg px-3 py-1.5 text-sm text-secondary"
              >
                <span>{unit.icon}</span>
                {unit.title}
              </span>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
