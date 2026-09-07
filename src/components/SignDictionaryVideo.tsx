"use client";

import { useEffect, useState } from "react";
import { ExternalLink, LoaderCircle, Play } from "lucide-react";
import {
  signaslCandidateVideos,
  signaslDictionaryUrl,
  toSignaslSlug,
  type SignaslLookup,
} from "@/lib/signasl";
import {
  signbslCandidateVideos,
  signbslDictionaryUrl,
  toSignbslSlug,
  type SignbslLookup,
} from "@/lib/signbsl";
import {
  SONASTIK_WORD_LIST,
  sonastikDictionaryUrl,
  type SonastikLookup,
} from "@/lib/sonastik";
import {
  NZSL_ORIGIN,
  nzslDictionaryUrl,
  nzslSearchUrl,
  toNzslKey,
  type NzslLookup,
} from "@/lib/nzsl";

export type SignVideoProvider = "asl" | "bsl" | "isl" | "nzsl";

type ProviderConfig = {
  label: string;
  site: string;
  home: string;
  api: string;
  toKey: (input: string) => string;
  dictionaryUrl: (key: string) => string;
  candidates: (key: string) => string[];
};

const PROVIDER: Record<SignVideoProvider, ProviderConfig> = {
  asl: {
    label: "SignASL",
    site: "SignASL.org",
    home: "https://www.signasl.org/",
    api: "/api/signasl",
    toKey: toSignaslSlug,
    dictionaryUrl: signaslDictionaryUrl,
    candidates: signaslCandidateVideos,
  },
  bsl: {
    label: "SignBSL",
    site: "SignBSL.com",
    home: "https://www.signbsl.com/",
    api: "/api/signbsl",
    toKey: toSignbslSlug,
    dictionaryUrl: signbslDictionaryUrl,
    candidates: signbslCandidateVideos,
  },
  isl: {
    label: "sonastik.ead.ee",
    site: "sonastik.ead.ee",
    home: SONASTIK_WORD_LIST,
    api: "/api/sonastik",
    toKey: (input) => input.trim(),
    dictionaryUrl: (key) =>
      /^\d+$/.test(key) ? sonastikDictionaryUrl(key) : SONASTIK_WORD_LIST,
    candidates: () => [],
  },
  nzsl: {
    label: "NZSL Online",
    site: "NZSL.nz",
    home: NZSL_ORIGIN,
    api: "/api/nzsl",
    toKey: toNzslKey,
    dictionaryUrl: (key) =>
      /^\d+$/.test(key) ? nzslDictionaryUrl(key) : nzslSearchUrl(key),
    candidates: () => [],
  },
};

export function SignDictionaryVideo({
  provider,
  word,
  compact = false,
}: {
  provider: SignVideoProvider;
  word: string;
  compact?: boolean;
}) {
  const cfg = PROVIDER[provider];
  const key = cfg.toKey(word);
  const [dictionaryUrl, setDictionaryUrl] = useState(cfg.dictionaryUrl(key));
  const [videos, setVideos] = useState<string[]>(cfg.candidates(key));
  const [poster, setPoster] = useState<string | undefined>();
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setSourceIndex(0);
    setVideos(cfg.candidates(key));
    setDictionaryUrl(cfg.dictionaryUrl(key));
    setPoster(undefined);

    fetch(`${cfg.api}/${encodeURIComponent(key)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: SignaslLookup | SignbslLookup | SonastikLookup | NzslLookup | null) => {
        if (cancelled || !data) return;
        if ("dictionaryUrl" in data && data.dictionaryUrl) {
          setDictionaryUrl(data.dictionaryUrl);
        }
        if (data.videos?.length) setVideos(data.videos);
        if ("poster" in data && data.poster) setPoster(data.poster);
      })
      .catch(() => {
        /* keep candidate URLs / dictionary link */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [key, provider]);

  if (!key) return null;

  const current = videos[sourceIndex];

  return (
    <div
      className={`overflow-hidden rounded-[16px] border border-border bg-bg ${
        compact ? "" : "mb-4"
      }`}
    >
      <div className="relative aspect-video bg-[#1d1d1f]">
        {!failed && current ? (
          <video
            key={current}
            className="h-full w-full object-contain"
            controls
            playsInline
            autoPlay
            muted
            loop
            preload="metadata"
            poster={poster}
            src={current}
            onLoadedData={() => setLoading(false)}
            onError={() => {
              if (sourceIndex + 1 < videos.length) {
                setSourceIndex((i) => i + 1);
              } else {
                setFailed(true);
                setLoading(false);
              }
            }}
          />
        ) : (
          <a
            href={dictionaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-white"
          >
            <Play size={28} />
            <span className="text-sm font-medium">
              Watch on {cfg.label}
            </span>
          </a>
        )}

        {loading && !failed && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
            <LoaderCircle className="animate-spin text-white" size={22} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
        <p className="text-xs text-secondary">
          Video via{" "}
          <a
            href={cfg.home}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            {cfg.site}
          </a>
        </p>
        <a
          href={dictionaryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Dictionary <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}

export function SignASLVideo(props: { word: string; compact?: boolean }) {
  return <SignDictionaryVideo provider="asl" {...props} />;
}

export function SignBSLVideo(props: { word: string; compact?: boolean }) {
  return <SignDictionaryVideo provider="bsl" {...props} />;
}

export function SignISLVideo(props: { word: string; compact?: boolean }) {
  return <SignDictionaryVideo provider="isl" {...props} />;
}

export function SignNZSLVideo(props: { word: string; compact?: boolean }) {
  return <SignDictionaryVideo provider="nzsl" {...props} />;
}
