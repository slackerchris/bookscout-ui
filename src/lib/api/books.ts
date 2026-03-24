import type { Book } from '@/types'
import { api } from './client'

export interface BooksParams {
  author_id?: string
  have_it?: boolean
  confidence_band?: 'high' | 'medium' | 'low'
  missing_only?: boolean
  q?: string
}

export const booksApi = {
  // BookScout returns a flat array — no pagination wrapper.
  list: (params: BooksParams = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)]),
    ).toString()
    return api.get<Book[]>(`/books/${qs ? `?${qs}` : ''}`)
  },

  get: (id: string) => api.get<Book>(`/books/${id}`),
}
