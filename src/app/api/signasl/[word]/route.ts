import {
  signaslCandidateVideos,
  signaslDictionaryUrl,
  toSignaslSlug,
  type SignaslLookup,
} from "@/lib/signasl";

export const runtime = "nodejs";
export const revalidate = 86400;

function unique(urls: string[]): string[] {
  return [...new Set(urls)];
}

function extractVideos(html: string): string[] {
  const matches = html.match(
    /https:\/\/media\.signbsl\.com\/videos\/asl\/[^"'\\\s>]+\.mp4/g,
  );
  return unique(matches ?? []);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ word: string }> },
) {
  const { word: raw } = await context.params;
  const word = toSignaslSlug(decodeURIComponent(raw));

  if (!word) {
    return Response.json({ error: "Missing word" }, { status: 400 });
  }

  const dictionaryUrl = signaslDictionaryUrl(word);
  let scraped: string[] = [];

  try {
    const res = await fetch(dictionaryUrl, {
      headers: {
        "User-Agent":
          "LingoraLanguageApp/1.0 (+https://github.com/julsteretsluj/languages; educational ASL reference)",
        Accept: "text/html,application/xhtml+xml",
      },
      next: { revalidate: 86400 },
    });

    if (res.ok) {
      scraped = extractVideos(await res.text());
    }
  } catch {
    // Fall through to candidate CDN URLs.
  }

  const payload: SignaslLookup = {
    word,
    dictionaryUrl,
    videos: unique([...scraped, ...signaslCandidateVideos(word)]).slice(0, 8),
  };

  return Response.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
