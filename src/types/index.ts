// ---- Books ----------------------------------------------------------------

export interface Book {
  id: number
  title: string
  title_sort: string
  subtitle: string | null
  isbn: string | null
  isbn13: string | null
  asin: string | null
  release_date: string | null
  published_year: number | null
  series_name: string | null
  series_position: string | null
  format: string | null
  source: string | null
  cover_url: string | null
  description: string | null
  score: number
  confidence_band: 'high' | 'medium' | 'low'
  language: string | null
  narrator: string | null
  have_it: boolean
  deleted: boolean
  match_method: string
  created_at: string
  updated_at: string
}

// ---- Authors --------------------------------------------------------------

export interface Author {
  id: number
  name: string
  name_sort: string
  asin: string | null
  openlibrary_key: string | null
  active: boolean
  /** ISO datetime string — only populated by GET /authors/{id}, always null from list endpoint */
  last_scanned: string | null
}

/** Returned by GET /authors/{id} only — extends Author with aggregate counts */
export interface AuthorDetail extends Author {
  book_count: number
  owned_count: number
}

export interface Coauthor {
  id: number
  name: string
  on_watchlist: boolean
  book_count: number
}

// ---- SSE Events -----------------------------------------------------------

/**
 * Known real event types published by the BookScout SSE stream.
 * Open string union keeps the UI forward-compatible with new event types.
 */
export type EventType = 'scan.complete' | 'coauthor.discovered' | (string & {})

export interface BookScoutEvent {
  /** Assigned client-side when accumulating events in component state. */
  _clientId?: string
  /** Normalised from the `event` field in the raw SSE payload. */
  event_type: EventType
  timestamp: string
  payload: Record<string, unknown>
}
