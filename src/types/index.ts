// ---- Books ----------------------------------------------------------------

export interface Book {
  id: number
  title: string
  score: number
  confidence_band: 'high' | 'medium' | 'low'
  have_it: boolean
  deleted: boolean
}

// ---- Authors --------------------------------------------------------------

export interface Author {
  id: number
  name: string
  name_sort: string
  active: boolean
  /** ISO datetime string — field is `last_scanned` in the BookScout API */
  last_scanned: string | null
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
