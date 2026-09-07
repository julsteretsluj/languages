"use client";

import { useState } from "react";
import Link from "next/link";
import { Flame, Heart, LogOut, Sparkles, UserRound, Zap } from "lucide-react";
import { useProgress } from "./ProgressProvider";
import { useAuth } from "./AuthProvider";
import { AuthModal } from "./AuthModal";
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
  const { progress, ready, syncing } = useProgress();
  const { user, signOut } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const langProg = languageId ? getLangProgress(progress, languageId) : null;
  const language = languageId ? getLanguage(languageId) : null;

  return (
    <>
      <header className="sticky top-0 z-40 border-b-2 border-border/90 bg-surface/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3">
            {backHref ? (
              <Link
                href={backHref}
                className="rounded-full px-3 py-1.5 text-sm font-semibold text-secondary transition-colors hover:bg-[#ffe6f2] hover:text-primary"
              >
                ← Back
              </Link>
            ) : (
              <Link href="/" className="flex items-center gap-2">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-2xl text-white shadow-[var(--shadow)]"
                  style={{
                    background: "linear-gradient(135deg, #ff2d95, #ff7a18)",
                  }}
                >
                  <Sparkles size={16} />
                </span>
                <span className="text-[17px] font-extrabold tracking-tight">
                  Lingora
                </span>
              </Link>
            )}
            {title && (
              <span className="truncate text-sm font-semibold text-secondary">
                {title}
              </span>
            )}
            {language && !title && (
              <span className="truncate text-sm font-semibold text-secondary">
                {language.flag} {language.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {ready && langProg && (
              <div className="flex items-center gap-2 text-sm font-extrabold sm:gap-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#ffe14d]/45 px-2.5 py-1 text-[#8a6a00]">
                  <Flame size={14} fill="currentColor" />
                  {langProg.streak}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#ff3b5c]/15 px-2.5 py-1 text-[#ff3b5c]">
                  <Heart size={14} fill="currentColor" />
                  {langProg.hearts}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#ff2d95]/15 px-2.5 py-1 text-primary">
                  <Zap size={14} fill="currentColor" />
                  {langProg.xp}
                </span>
              </div>
            )}

            {user ? (
              <div className="flex items-center gap-1.5">
                <span
                  className="hidden max-w-[140px] truncate rounded-full bg-[#ffe6f2] px-2.5 py-1 text-xs font-extrabold text-primary sm:inline"
                  title={user.email ?? undefined}
                >
                  {syncing ? "Syncing…" : user.email}
                </span>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1.5 text-xs font-extrabold text-secondary hover:border-primary hover:text-primary"
                  title="Sign out"
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-extrabold text-white hover:bg-[#0077ED]"
              >
                <UserRound size={14} />
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
