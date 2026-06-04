// ---- Books ----------------------------------------------------------------

import type { components } from '@/lib/api/generated'

type ApiSchemas = components['schemas']

export type ConfidenceBand = 'high' | 'medium' | 'low'

export type Book = Required<ApiSchemas['BookOut']> & {
  confidence_band: ConfidenceBand
}

// ---- Authors --------------------------------------------------------------

export type Author = Required<ApiSchemas['AuthorOut']>

/** Returned by GET /authors/{id} only — extends Author with aggregate counts */
export type AuthorDetail = Required<ApiSchemas['AuthorDetailOut']>

export type Coauthor = ApiSchemas['CoAuthorOut']

// ---- SSE Events -----------------------------------------------------------

/**
 * Known real event types published by the BookScout SSE stream.
 * Open string union keeps the UI forward-compatible with new event types.
 */
export type EventType = 'scan.complete' | 'coauthor.discovered' | 'import.complete' | (string & {})

export interface ImportCompletePayload {
  book_id: number
  book_title: string
  author_name: string
  destination: string
  files_copied: string[]
}

export interface BookScoutEvent {
  /** Assigned client-side when accumulating events in component state. */
  _clientId?: string
  /** Normalised from the `event` field in the raw SSE payload. */
  event_type: EventType
  timestamp: string
  payload: Record<string, unknown>
}
