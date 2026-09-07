/** International Sign dictionary — https://sonastik.ead.ee/embed/en/word-list */

export const SONASTIK_ORIGIN = "https://sonastik.ead.ee";
export const SONASTIK_WORD_LIST = `${SONASTIK_ORIGIN}/embed/en/word-list`;

export function sonastikDictionaryUrl(wordId: string | number): string {
  return `${SONASTIK_ORIGIN}/embed/en/search?word=${encodeURIComponent(String(wordId))}`;
}

export function sonastikToggleUrl(wordId: string | number): string {
  return `${SONASTIK_ORIGIN}/ajax/index/test-toggle?wordId=${encodeURIComponent(String(wordId))}&i=2&currentCode=en`;
}

export function normalizeSonastikLabel(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[!?.,]/g, "")
    .replace(/\s+/g, " ");
}

export type SonastikLookup = {
  word: string;
  wordId: string;
  label: string;
  dictionaryUrl: string;
  wordListUrl: string;
  videos: string[];
  poster?: string;
};
