import type { Author, AuthorDetail, AuthorPreferences, Coauthor } from '@/types'
import type { components } from './generated'
import { api } from './client'

export type AuthorUpdate = components['schemas']['AuthorUpdate']

export type WatchlistSettings = components['schemas']['WatchlistSettings']
export type AuthorPreferencesUpdate = components['schemas']['AuthorPreferencesUpdate']

export const authorsApi = {
  list: (params: { active_only?: boolean; search?: string } = {}) => {
    const parts: string[] = []
    if (params.active_only === false) parts.push('active_only=false')
    if (params.search) parts.push(`search=${encodeURIComponent(params.search)}`)
    const qs = parts.length ? `?${parts.join('&')}` : ''
    return api.get<Author[]>(`/authors/${qs}`)
  },
  count: (params: { active_only?: boolean; watched_only?: boolean } = {}) => {
    const parts: string[] = []
    if (params.active_only === false) parts.push('active_only=false')
    if (params.watched_only === false) parts.push('watched_only=false')
    const qs = parts.length ? `?${parts.join('&')}` : ''
    return api.get<{ count: number }>(`/authors/count${qs}`)
  },
  get: (id: number) => api.get<AuthorDetail>(`/authors/${id}`),
  add: (name: string) => api.post<Author>('/authors/', { name }),
  update: (id: number, patch: AuthorUpdate) => api.patch<Author>(`/authors/${id}`, patch),
  remove: (id: number) => api.delete<void>(`/authors/${id}`),
  scan: (id: number) => api.post<void>(`/scans/author/${id}`),
  watchlist: (id: number, settings: WatchlistSettings) =>
    api.patch<{ author_id: number; scan_enabled: boolean }>(`/authors/${id}/watchlist`, settings),
  unwatched: () => api.get<Author[]>('/authors/unwatched'),
  watch: (id: number) => api.post<Author>(`/authors/${id}/watch`),
  coauthors: (id: number) => api.get<Coauthor[]>(`/authors/${id}/coauthors`),
  preferences: (id: number) => api.get<AuthorPreferences>(`/authors/${id}/preferences`),
  updatePreferences: (id: number, patch: AuthorPreferencesUpdate) =>
    api.patch<AuthorPreferences>(`/authors/${id}/preferences`, patch),
  favorites: () => api.get<{ author_ids: number[] }>('/authors/favorites'),
  addFavorite: (id: number) => api.post<void>(`/authors/${id}/favorite`),
  removeFavorite: (id: number) => api.delete<void>(`/authors/${id}/favorite`),
}
