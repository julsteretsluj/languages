/** SignBSL.com dictionary helpers — https://www.signbsl.com/ */

export const SIGNBSL_ORIGIN = "https://www.signbsl.com";

/** Build a SignBSL dictionary slug from a gloss or English word. */
export function toSignbslSlug(input: string): string {
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

/** Canonical dictionary page for a BSL sign. */
export function signbslDictionaryUrl(slugOrWord: string): string {
  const slug = toSignbslSlug(slugOrWord);
  return `${SIGNBSL_ORIGIN}/sign/${slug}`;
}

/** Candidate CDN URLs SignBSL commonly hosts (progressive fallbacks). */
export function signbslCandidateVideos(slugOrWord: string): string[] {
  const slug = toSignbslSlug(slugOrWord);
  if (!slug) return [];
  const titled = slug.charAt(0).toUpperCase() + slug.slice(1);
  return [
    `https://media.signbsl.com/videos/bsl/signstation/${slug}.mp4`,
    `https://media.signbsl.com/videos/bsl/signstation/${slug}-2.mp4`,
    `https://media.signbsl.com/videos/bsl/deafway/mp4/${titled}.mp4`,
    `https://media.signbsl.com/videos/bsl/signmonkey/mp4/${slug}.mp4`,
  ];
}

export type SignbslLookup = {
  word: string;
  dictionaryUrl: string;
  videos: string[];
};
