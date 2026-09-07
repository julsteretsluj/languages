"use client";

import Link from "next/link";
import { Flame, Heart, Sparkles, Zap } from "lucide-react";
import { useProgress } from "./ProgressProvider";
import { getLangProgress } from "@/lib/progress";
import type { LanguageId } from "@/lib/types";
import { getLanguage } from "@/lib/languages";

export function AppHeader({
  languageId,
  backHref,
  title,
}: {
  languageId?: LanguageId;
  backHref?: string;
  title?: string;
}) {
  const { progress, ready } = useProgress();
  const langProg = languageId ? getLangProgress(progress, languageId) : null;
  const language = languageId ? getLanguage(languageId) : null;

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-3">
          {backHref ? (
            <Link
              href={backHref}
              className="rounded-full px-3 py-1.5 text-sm text-secondary transition-colors hover:bg-bg hover:text-ink"
            >
              ← Back
            </Link>
          ) : (
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white shadow-[var(--shadow)]">
                <Sparkles size={16} />
              </span>
              <span className="text-[17px] font-semibold tracking-tight">Lingora</span>
            </Link>
          )}
          {title && (
            <span className="truncate text-sm font-medium text-secondary">{title}</span>
          )}
          {language && !title && (
            <span className="truncate text-sm text-secondary">
              {language.flag} {language.name}
            </span>
          )}
        </div>

        {ready && langProg && (
          <div className="flex items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1 text-warning">
              <Flame size={16} fill="currentColor" />
              {langProg.streak}
            </span>
            <span className="inline-flex items-center gap-1 text-danger">
              <Heart size={16} fill="currentColor" />
              {langProg.hearts}
            </span>
            <span className="inline-flex items-center gap-1 text-primary">
              <Zap size={16} fill="currentColor" />
              {langProg.xp}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
