/** SignASL.org dictionary helpers — https://www.signasl.org/ */

export const SIGNASL_ORIGIN = "https://www.signasl.org";

/** Build a SignASL dictionary slug from a gloss or English word. */
export function toSignaslSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[#_]/g, " ")
    .replace(/\s*\/\s*/g, " ")
    .split(/[\s,]+/)
    .filter(Boolean)[0]
    ?.replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-") ?? "";
}

/** Canonical dictionary page for a sign. */
export function signaslDictionaryUrl(slugOrWord: string): string {
  const slug = toSignaslSlug(slugOrWord);
  return `${SIGNASL_ORIGIN}/sign/${slug}`;
}

/** Candidate CDN URLs SignASL commonly hosts (used as progressive fallbacks). */
export function signaslCandidateVideos(slugOrWord: string): string[] {
  const slug = toSignaslSlug(slugOrWord);
  if (!slug) return [];
  const sources = [
    "startasl",
    "elementalaslconcepts",
    "aslsearch",
    "signschool",
    "aslsignbank",
    "mariekatzenbachschool",
  ];
  return sources.map(
    (source) =>
      `https://media.signbsl.com/videos/asl/${source}/mp4/${slug}.mp4`,
  );
}

export type SignaslLookup = {
  word: string;
  dictionaryUrl: string;
  videos: string[];
};
