import {
  NZSL_ORIGIN,
  nzslDictionaryUrl,
  nzslSearchUrl,
  toNzslKey,
  type NzslLookup,
} from "@/lib/nzsl";

export const runtime = "nodejs";
export const revalidate = 86400;

function unique(urls: string[]): string[] {
  return [...new Set(urls)];
}

function extractFromHtml(html: string): {
  signId?: string;
  gloss?: string;
  videos: string[];
} {
  const videos = unique(
    [
      ...html.matchAll(
        /https:\/\/nzsl-signbank-media-production\.s3\.amazonaws\.com\/[^"'\\\s>]+\.mp4/g,
      ),
    ].map((m) => m[0]),
  );

  // Prefer main gloss videos first
  const preferred = [
    ...videos.filter((v) => v.includes("main_glosses")),
    ...videos.filter((v) => !v.includes("main_glosses")),
  ];

  const glossFromMain =
    html.match(/class=['"]main_gloss['"][^>]*>\s*([^<\n]+)/i)?.[1]?.trim() ||
    html.match(/main_gloss'>\s*([^<\n]+)/i)?.[1]?.trim();

  const glossFromLink = html
    .match(/href="https:\/\/www\.nzsl\.nz\/signs\/\d+">\s*([^<\n]+)/)?.[1]
    ?.trim();

  const idMatch =
    html.match(/canonical[^>]+\/signs\/(\d+)/i) ||
    html.match(/property="og:url"[^>]+\/signs\/(\d+)/i) ||
    html.match(/href="https:\/\/www\.nzsl\.nz\/signs\/(\d+)">\s*([^<\n]+)/) ||
    html.match(/data-sign-id="(\d+)"/) ||
    html.match(/\/signs\/(\d+)/);

  return {
    signId: idMatch?.[1],
    gloss: glossFromMain || glossFromLink,
    videos: unique(preferred).slice(0, 8),
  };
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "LingoraLanguageApp/1.0 (+https://github.com/julsteretsluj/languages; educational NZSL reference)",
        Accept: "text/html",
      },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ word: string }> },
) {
  const { word: raw } = await context.params;
  const query = toNzslKey(decodeURIComponent(raw));
  if (!query) {
    return Response.json({ error: "Missing word" }, { status: 400 });
  }

  let signId = /^\d+$/.test(query) ? query : undefined;
  let gloss = query;
  let videos: string[] = [];

  if (signId) {
    const html = await fetchHtml(nzslDictionaryUrl(signId));
    if (html) {
      const extracted = extractFromHtml(html);
      videos = extracted.videos;
      if (extracted.gloss) gloss = extracted.gloss;
    }
  } else {
    const html = await fetchHtml(nzslSearchUrl(query));
    if (html) {
      const extracted = extractFromHtml(html);
      signId = extracted.signId;
      if (extracted.gloss) gloss = extracted.gloss;
      videos = extracted.videos;

      // If search page only had cards, fetch the sign page for fuller video set
      if (signId && videos.length === 0) {
        const detail = await fetchHtml(nzslDictionaryUrl(signId));
        if (detail) {
          const more = extractFromHtml(detail);
          videos = more.videos;
          if (more.gloss) gloss = more.gloss;
        }
      }
    }
  }

  if (!signId) {
    return Response.json(
      {
        word: query,
        signId: "",
        gloss: query,
        dictionaryUrl: NZSL_ORIGIN,
        searchUrl: nzslSearchUrl(query),
        videos: [],
        error: "Sign not found in NZSL Online",
      },
      { status: 404 },
    );
  }

  const payload: NzslLookup = {
    word: query,
    signId,
    gloss,
    dictionaryUrl: nzslDictionaryUrl(signId),
    searchUrl: nzslSearchUrl(query),
    videos,
  };

  return Response.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
