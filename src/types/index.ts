// ---- Books ----------------------------------------------------------------

export interface Book {
  id: string
  title: string
  author: string
  confidence: number
  owned: boolean
  ignored: boolean
  wanted: boolean
  last_scan_at: string | null
}

// ---- Authors --------------------------------------------------------------

export interface Author {
  id: string
  name: string
  last_scan_at: string | null
  coauthors: string[]
}

// ---- Actions / Jobs -------------------------------------------------------

export type ActionStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled'
export type ActionType =
  | 'scan'
  | 'search'
  | 'download'
  | 'ignore'
  | 'mark_owned'
  | 'retry'

export interface Action {
  id: string
  type: ActionType
  target_type: 'book' | 'author'
  target_id: string
  status: ActionStatus
  message: string | null
  external_ref: string | null
  started_at: string
  updated_at: string
}

// ---- Events ---------------------------------------------------------------

export type EventType =
  | 'scan_started'
  | 'scan_completed'
  | 'search_sent'
  | 'download_queued'
  | 'download_completed'
  | 'action_failed'
  | 'notification_sent'
  | 'missing_book_found'

export interface BookScoutEvent {
  id: string
  event_type: EventType
  timestamp: string
  payload: Record<string, unknown>
}

// ---- Integrations ---------------------------------------------------------

export type IntegrationService =
  | 'audiobookshelf'
  | 'prowlarr'
  | 'downloader'
  | 'bookscout'
  | 'n8n'

export interface IntegrationStatus {
  service: IntegrationService
  connected: boolean
  last_checked_at: string | null
  message: string | null
}

// ---- Dashboard stats ----------------------------------------------------

export interface DashboardStats {
  missing_books: number
  high_confidence_missing: number
  active_downloads: number
  recent_failures: number
  authors_tracked: number
  last_scan_at: string | null
}

// ---- Pagination -----------------------------------------------------------

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}
