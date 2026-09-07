/** NZSL Online dictionary — https://www.nzsl.nz/ */

export const NZSL_ORIGIN = "https://www.nzsl.nz";

export function nzslDictionaryUrl(signId: string | number): string {
  return `${NZSL_ORIGIN}/signs/${encodeURIComponent(String(signId))}`;
}

export function nzslSearchUrl(query: string): string {
  return `${NZSL_ORIGIN}/signs/search?s=${encodeURIComponent(query)}`;
}

export function toNzslKey(input: string): string {
  return input.trim().toLowerCase();
}

export type NzslLookup = {
  word: string;
  signId: string;
  gloss: string;
  dictionaryUrl: string;
  searchUrl: string;
  videos: string[];
};
