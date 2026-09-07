"use client";

import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { useProgress } from "@/components/ProgressProvider";
import { LANGUAGES } from "@/lib/languages";
import { getTotalLessonCount, isUnitComplete } from "@/lib/lessons";
import { getLangProgress } from "@/lib/progress";
import { UNITS } from "@/lib/units";
import type { LanguageId } from "@/lib/types";

const CHIP_STYLES = [
  "chip-cyan",
  "chip-yellow",
  "chip-lime",
  "chip-violet",
] as const;

export default function HomePage() {
  const { progress, ready, chooseLanguage } = useProgress();

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-8">
        <section className="animate-fade-up relative overflow-hidden rounded-[28px] border border-border bg-surface px-6 py-12 shadow-[var(--shadow-strong)] sm:px-12">
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "var(--grad-hero)" }}
          />
          <div
            className="pointer-events-none absolute -right-8 top-6 h-36 w-36 rounded-full opacity-80"
            style={{
              background:
                "linear-gradient(135deg, #ff2d95, #ff7a18)",
              filter: "blur(2px)",
            }}
          />
          <div
            className="pointer-events-none absolute bottom-4 left-10 h-20 w-20 rounded-full opacity-70"
            style={{ background: "#00d4ff" }}
          />
          <div
            className="pointer-events-none absolute right-24 bottom-10 h-14 w-14 rotate-12 rounded-2xl opacity-80"
            style={{ background: "#ffe14d" }}
          />
          <div className="relative max-w-xl">
            <p className="inline-flex rounded-full bg-primary/15 px-3 py-1 text-sm font-extrabold tracking-wide text-primary">
              Lingora
            </p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
              Learn to speak —{" "}
              <span className="bg-gradient-to-r from-[#ff2d95] via-[#ff7a18] to-[#00d4ff] bg-clip-text text-transparent">
                and sign.
              </span>
            </h1>
            <p className="mt-4 text-[17px] leading-relaxed text-secondary">
              Bright lessons through grammar, everyday life, culture, and conversation
              across nine languages — including four signed languages with real dictionary
              videos.
            </p>
            <p className="mt-5 flex flex-wrap gap-2 text-sm font-semibold">
              <span className="rounded-full bg-[#ff2d95]/15 px-3 py-1 text-primary">
                {UNITS.length} units
              </span>
              <span className="rounded-full bg-[#00d4ff]/20 px-3 py-1 text-[#007a99]">
                {LANGUAGES.length} languages
              </span>
              <span className="rounded-full bg-[#ffe14d]/40 px-3 py-1 text-[#8a6a00]">
                XP · streaks · hearts
              </span>
            </p>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-2xl font-extrabold tracking-tight">Choose a language</h2>
            <p className="mt-1 text-secondary">
              Start anywhere. Progress is saved on this device.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LANGUAGES.map((lang, index) => {
              const lp = ready ? getLangProgress(progress, lang.id) : null;
              const completed = lp?.completedLessons ?? [];
              const total = getTotalLessonCount(lang.id);
              const done = completed.filter((id) =>
                id.startsWith(`${lang.id}-`),
              ).length;
              const unitsDone = UNITS.filter((u) =>
                isUnitComplete(lang.id, u.id, completed),
              ).length;
              const pct = total ? Math.round((done / total) * 100) : 0;
              const chip = CHIP_STYLES[index % CHIP_STYLES.length];

              return (
                <Link
                  key={lang.id}
                  href={`/learn/${lang.id}`}
                  onClick={() => chooseLanguage(lang.id as LanguageId)}
                  className="animate-fade-up group relative overflow-hidden rounded-[22px] border-2 border-border bg-surface p-5 shadow-[var(--shadow)] transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-[var(--shadow-strong)]"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <div
                    className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-40"
                    style={{
                      background:
                        index % 3 === 0
                          ? "#ff2d95"
                          : index % 3 === 1
                            ? "#00d4ff"
                            : "#ffe14d",
                    }}
                  />
                  <div className="relative flex items-start justify-between gap-3">
                    <div>
                      <div className="text-3xl">{lang.flag}</div>
                      <h3 className="mt-3 text-lg font-extrabold tracking-tight group-hover:text-primary">
                        {lang.name}
                      </h3>
                      <p className="text-sm font-semibold text-secondary">
                        {lang.nativeName}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${chip}`}
                    >
                      {lang.modality === "signed" ? "Signed" : "Spoken"}
                    </span>
                  </div>
                  <p className="relative mt-3 text-sm leading-relaxed text-secondary">
                    {lang.description}
                  </p>
                  {ready && (
                    <div className="relative mt-4">
                      <div className="mb-1 flex justify-between text-xs font-semibold text-tertiary">
                        <span>
                          {done}/{total} lessons · {unitsDone}/{UNITS.length} units
                        </span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#ffe6f2]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background:
                              "linear-gradient(90deg, #ff2d95, #ff7a18, #ffe14d)",
                          }}
                        />
                      </div>
                      {lp && lp.xp > 0 && (
                        <p className="mt-2 text-xs font-semibold text-secondary">
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

        <section className="mt-12 overflow-hidden rounded-[22px] border-2 border-border bg-surface p-6 shadow-[var(--shadow)] sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Your learning path</h2>
              <p className="mt-1 max-w-2xl text-secondary">
                Every language follows the same unit order — foundations first, then daily
                life, society, and expressive skills.
              </p>
            </div>
            <span className="inline-flex w-fit rounded-full bg-[#b8ff3c]/35 px-3 py-1 text-xs font-extrabold text-[#3d6b00]">
              32 colorful units
            </span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {UNITS.map((unit, i) => (
              <span
                key={unit.id}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold ${
                  CHIP_STYLES[i % CHIP_STYLES.length]
                } border-transparent`}
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
