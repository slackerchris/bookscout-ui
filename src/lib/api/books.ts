import type { Book, Paginated } from '@/types'
import { api } from './client'

export interface BooksParams {
  page?: number
  page_size?: number
  author?: string
  owned?: boolean
  ignored?: boolean
  wanted?: boolean
  search?: string
}

export const booksApi = {
  list: (params: BooksParams = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString()
    return api.get<Paginated<Book>>(`/books${qs ? `?${qs}` : ''}`)
  },

  get: (id: string) => api.get<Book>(`/books/${id}`),

  search: (id: string) => api.post<void>(`/books/${id}/search`),
  download: (id: string) => api.post<void>(`/books/${id}/download`),
  ignore: (id: string) => api.post<void>(`/books/${id}/ignore`),
  markOwned: (id: string) => api.post<void>(`/books/${id}/mark-owned`),
}
