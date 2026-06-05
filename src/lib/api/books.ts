import type { Book, BookWithAuthor } from '@/types'
import type { components } from './generated'
import { api } from './client'

export interface BooksParams {
  author_id?: number
  have_it?: boolean
  confidence_band?: 'high' | 'medium' | 'low'
  missing_only?: boolean
  include_deleted?: boolean
  limit?: number
  offset?: number
}

export type BookUpdate = components['schemas']['BookUpdate'] & {
  title?: string | null
  narrator?: string | null
  release_date?: string | null
}

export interface DuplicateGroup {
  author_id: number
  author_name: string
  books: Array<import('@/types').Book & { author_id: number; author_name: string }>
}

export interface DownloadHistoryItem {
  id: number
  book_id: number | null
  book_title: string | null
  query: string | null
  release_title: string
  indexer: string | null
  source: string | null
  type: string | null
  size_bytes: number | null
  seeders: number | null
  download_url: string | null
  status: 'queued' | 'failed'
  error_detail: string | null
  created_at: string
}

export interface DownloadPreferences {
  min_seeders: number
  preferred_format: string
  language: string
  require_unabridged: boolean
  max_size_gb: number
}

export interface BooksCountParams {
  author_id?: number
  confidence_band?: 'high' | 'medium' | 'low'
  have_it?: boolean
  missing_only?: boolean
  include_deleted?: boolean
}

export interface BooksDiscoveryParams {
  limit?: number
  missing_only?: boolean
  confidence_band?: 'high' | 'medium' | 'low'
}

export type BookSummary = {
  total: number
  missing: number
  high_confidence_missing: number
  upcoming_missing: number
  no_release_date: number
}

function toQueryString<T extends object>(params: T) {
  return new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '' && String(v) !== 'undefined')
      .map(([k, v]) => [k, String(v)]),
  ).toString()
}

export const booksApi = {
  // BookScout returns a flat array — no pagination wrapper.
  list: (params: BooksParams = {}) => {
    const qs = toQueryString(params)
    return api.get<Book[]>(`/books/${qs ? `?${qs}` : ''}`)
  },

  count: (params: BooksCountParams = {}) => {
    const qs = toQueryString(params)
    return api.get<{ count: number }>(`/books/count${qs ? `?${qs}` : ''}`)
  },

  get: (id: number) => api.get<Book>(`/books/${id}`),
  update: (id: number, patch: BookUpdate) => api.patch<Book>(`/books/${id}`, patch),
  remove: (id: number) => api.delete<void>(`/books/${id}`),
  recentlyImported: (limit = 20) => api.get<Book[]>(`/books/recently-imported?limit=${limit}`),
  recentlyDiscovered: (params: Omit<BooksDiscoveryParams, 'confidence_band'> = {}) => {
    const qs = toQueryString(params)
    return api.get<BookWithAuthor[]>(`/books/recently-discovered${qs ? `?${qs}` : ''}`)
  },
  upcoming: (params: BooksDiscoveryParams = {}) => {
    const qs = toQueryString(params)
    return api.get<BookWithAuthor[]>(`/books/upcoming${qs ? `?${qs}` : ''}`)
  },
  summary: () => api.get<BookSummary>('/books/summary'),
  rescan: (id: number) => api.post<{ job_id: string; author_id: number; book_id: number; status: string }>(`/books/${id}/rescan`),
  export: () => fetch('/api/v1/books/export').then((r) => r.blob()),
  duplicates: () => api.get<DuplicateGroup[]>('/books/duplicates'),
  downloadHistory: (limit = 100) => api.get<DownloadHistoryItem[]>(`/download-history/?limit=${limit}`),
  clearDownloadHistory: () => api.delete<{ deleted: number }>('/download-history/'),
  getDownloadPreferences: () => api.get<DownloadPreferences>('/settings/download-preferences'),
  updateDownloadPreferences: (patch: Partial<DownloadPreferences>) =>
    api.patch<DownloadPreferences>('/settings/download-preferences', patch),
}
