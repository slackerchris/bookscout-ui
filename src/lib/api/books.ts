import type { Book, Paginated } from '@/types'
import { api } from './client'

export interface BooksParams {
  page?: number
  page_size?: number
  author_id?: string
  have_it?: boolean
  confidence_band?: 'high' | 'medium' | 'low'
  missing_only?: boolean
  q?: string
}

export const booksApi = {
  list: (params: BooksParams = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString()
    return api.get<Paginated<Book>>(`/books/${qs ? `?${qs}` : ''}`)
  },

  get: (id: string) => api.get<Book>(`/books/${id}`),
}
