import type { Author, AuthorDetail, Coauthor } from '@/types'
import { api } from './client'

export interface AuthorUpdate {
  name?: string
  active?: boolean
}

export interface WatchlistSettings {
  scan_enabled?: boolean
}

export const authorsApi = {
  list: (params: { active_only?: boolean } = {}) => {
    const qs =
      params.active_only === false ? '?active_only=false' : ''
    return api.get<Author[]>(`/authors/${qs}`)
  },
  get: (id: number) => api.get<AuthorDetail>(`/authors/${id}`),
  add: (name: string) => api.post<Author>('/authors/', { name }),
  update: (id: number, patch: AuthorUpdate) => api.patch<Author>(`/authors/${id}`, patch),
  remove: (id: number) => api.delete<void>(`/authors/${id}`),
  scan: (id: number) => api.post<void>(`/scans/author/${id}`),
  watchlist: (id: number, settings: WatchlistSettings) =>
    api.patch<{ author_id: number; scan_enabled: boolean }>(`/authors/${id}/watchlist`, settings),
  coauthors: (id: number) => api.get<Coauthor[]>(`/authors/${id}/coauthors`),
}
