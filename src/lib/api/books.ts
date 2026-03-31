import type { Book } from '@/types'
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

export interface BookUpdate {
  have_it?: boolean
  series_name?: string | null
  series_position?: string | null
  subtitle?: string | null
  deleted?: boolean
  asin?: string | null
  isbn?: string | null
  isbn13?: string | null
}

export interface BooksCountParams {
  author_id?: number
  confidence_band?: 'high' | 'medium' | 'low'
  have_it?: boolean
  missing_only?: boolean
  include_deleted?: boolean
}

export const booksApi = {
  // BookScout returns a flat array — no pagination wrapper.
  list: (params: BooksParams = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '' && String(v) !== 'undefined')
        .map(([k, v]) => [k, String(v)]),
    ).toString()
    return api.get<Book[]>(`/books/${qs ? `?${qs}` : ''}`)
  },

  count: (params: BooksCountParams = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '' && String(v) !== 'undefined')
        .map(([k, v]) => [k, String(v)]),
    ).toString()
    return api.get<{ count: number }>(`/books/count${qs ? `?${qs}` : ''}`)
  },

  get: (id: number) => api.get<Book>(`/books/${id}`),
  update: (id: number, patch: BookUpdate) => api.patch<Book>(`/books/${id}`, patch),
  remove: (id: number) => api.delete<void>(`/books/${id}`),
  recentlyImported: (limit = 20) => api.get<Book[]>(`/books/recently-imported?limit=${limit}`),
}
