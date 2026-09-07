import {
  normalizeSonastikLabel,
  SONASTIK_ORIGIN,
  SONASTIK_WORD_LIST,
  sonastikDictionaryUrl,
  sonastikToggleUrl,
  type SonastikLookup,
} from "@/lib/sonastik";

export const runtime = "nodejs";
export const revalidate = 86400;

type WordEntry = { id: string; label: string };

let wordListCache: WordEntry[] | null = null;

async function loadWordList(): Promise<WordEntry[]> {
  if (wordListCache) return wordListCache;

  const res = await fetch(SONASTIK_WORD_LIST, {
    headers: {
      "User-Agent":
        "LingoraLanguageApp/1.0 (+https://github.com/julsteretsluj/languages; educational IS reference)",
      Accept: "text/html",
    },
    next: { revalidate: 86400 },
  });

  if (!res.ok) return [];
  const html = await res.text();
  const pairs = [
    ...html.matchAll(/href="\/embed\/en\/search\?word=(\d+)">([^<]+)<\/a>/g),
  ].map((m) => ({ id: m[1], label: m[2].trim() }));

  wordListCache = pairs;
  return pairs;
}

function resolveEntry(query: string, list: WordEntry[]): WordEntry | null {
  const q = normalizeSonastikLabel(query);
  if (!q) return null;

  if (/^\d+$/.test(q)) {
    const byId = list.find((w) => w.id === q);
    if (byId) return byId;
    return { id: q, label: q };
  }

  const exact = list.find((w) => normalizeSonastikLabel(w.label) === q);
  if (exact) return exact;

  const stripped = list.find(
    (w) => normalizeSonastikLabel(w.label.replace(/!$/, "")) === q,
  );
  if (stripped) return stripped;

  const starts = list.find((w) =>
    normalizeSonastikLabel(w.label).startsWith(q),
  );
  return starts ?? null;
}

function extractVideos(html: string): { videos: string[]; poster?: string } {
  const videos = [
    ...new Set(
      [...html.matchAll(/src="(https:\/\/[^"]+\.mp4)"/g)].map((m) => m[1]),
    ),
  ];
  // Prefer higher-res when available, keep unique paths by base name order as returned
  const preferred = [
    ...videos.filter((v) => v.includes("-720.")),
    ...videos.filter((v) => v.includes("-1080.")),
    ...videos.filter((v) => !v.includes("-720.") && !v.includes("-1080.")),
  ];
  const unique = [...new Set(preferred)];
  const poster = html.match(/poster="(https:\/\/[^"]+)"/)?.[1];
  return { videos: unique.slice(0, 8), poster };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ word: string }> },
) {
  const { word: raw } = await context.params;
  const query = decodeURIComponent(raw).trim();
  if (!query) {
    return Response.json({ error: "Missing word" }, { status: 400 });
  }

  let list: WordEntry[] = [];
  try {
    list = await loadWordList();
  } catch {
    list = [];
  }

  const entry = resolveEntry(query, list);
  if (!entry) {
    return Response.json(
      {
        word: query,
        wordId: "",
        label: query,
        dictionaryUrl: SONASTIK_WORD_LIST,
        wordListUrl: SONASTIK_WORD_LIST,
        videos: [],
        error: "Word not found in International Sign dictionary",
      },
      { status: 404 },
    );
  }

  let videos: string[] = [];
  let poster: string | undefined;

  try {
    const res = await fetch(sonastikToggleUrl(entry.id), {
      headers: {
        "User-Agent":
          "LingoraLanguageApp/1.0 (+https://github.com/julsteretsluj/languages; educational IS reference)",
        "X-Requested-With": "XMLHttpRequest",
        Accept: "text/html",
        Referer: `${SONASTIK_ORIGIN}/embed/en/search?word=${entry.id}`,
      },
      next: { revalidate: 86400 },
    });
    if (res.ok) {
      const extracted = extractVideos(await res.text());
      videos = extracted.videos;
      poster = extracted.poster;
    }
  } catch {
    // leave empty — UI will deep-link to dictionary
  }

  const payload: SonastikLookup = {
    word: query,
    wordId: entry.id,
    label: entry.label,
    dictionaryUrl: sonastikDictionaryUrl(entry.id),
    wordListUrl: SONASTIK_WORD_LIST,
    videos,
    poster,
  };

  return Response.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
