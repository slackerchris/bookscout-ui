export interface BooksFilter {
  confidence_band: 'all' | 'high' | 'medium' | 'low'
  missing_only: boolean
  author_id: number | 'all'
  english_only: boolean
}

// Matches titles that contain characters from clearly non-Latin scripts.
// Fallback for rows with no language set: if a title is Latin-script (including
// accented Latin text), keep it. This avoids false negatives for English titles
// containing names/loanwords with diacritics.
//
// Filtering priority when english_only is on:
//   1. If book.language is set, use it as ground truth.
//   2. If book.language is null, fall back to title heuristic.
const NON_LATIN_RE = /[\p{Script=Cyrillic}\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Thai}\p{Script=Devanagari}]/u

export function isNonLatinTitle(title: string): boolean {
  return NON_LATIN_RE.test(title)
}

// "Cleared" state, no filters applied. Pages set their own initial state.
export const DEFAULT_BOOKS_FILTER: BooksFilter = {
  confidence_band: 'all',
  missing_only: false,
  author_id: 'all',
  english_only: false,
}
