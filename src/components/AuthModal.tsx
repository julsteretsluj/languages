"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "./AuthProvider";

export function AuthModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { signIn, signUp, configured } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        const err = await signIn(email.trim(), password);
        if (err) setError(err);
        else onClose();
      } else {
        const err = await signUp(email.trim(), password);
        if (err?.toLowerCase().includes("check your email")) {
          setInfo(err);
          setMode("signin");
        } else if (err) {
          setError(err);
        } else {
          onClose();
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-[22px] border-2 border-border bg-surface p-6 shadow-[var(--shadow-strong)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 text-secondary hover:bg-[#ffe6f2] hover:text-primary"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <h2 className="pr-8 text-2xl font-extrabold tracking-tight">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="mt-2 text-sm text-secondary">
          Progress saves to your Lingora account so you can continue on any device.
        </p>

        {!configured ? (
          <p className="mt-4 rounded-[12px] bg-[#ffe6f2] px-3 py-2 text-sm font-semibold text-primary">
            Auth is not configured. Add Supabase env vars to enable login.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-tertiary">
                Email
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[12px] border border-border bg-bg px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-tertiary">
                Password
              </span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[12px] border border-border bg-bg px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary"
              />
            </label>

            {error && (
              <p className="rounded-[12px] bg-[#ff3b5c]/12 px-3 py-2 text-sm font-semibold text-[#ff3b5c]">
                {error}
              </p>
            )}
            {info && (
              <p className="rounded-[12px] bg-[#00d4ff]/15 px-3 py-2 text-sm font-semibold text-[#007a99]">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn-hot w-full rounded-full px-5 py-3 text-sm font-extrabold disabled:opacity-60"
            >
              {busy
                ? "Working…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-secondary">
          {mode === "signin" ? (
            <>
              New here?{" "}
              <button
                type="button"
                className="font-extrabold text-primary hover:underline"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setInfo(null);
                }}
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already learning?{" "}
              <button
                type="button"
                className="font-extrabold text-primary hover:underline"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setInfo(null);
                }}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
