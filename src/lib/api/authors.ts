import type { Author, Coauthor } from '@/types'
import { api } from './client'

export const authorsApi = {
  list: () => api.get<Author[]>('/authors/'),
  get: (id: number) => api.get<Author>(`/authors/${id}`),
  add: (name: string) => api.post<Author>('/authors/', { name }),
  remove: (id: number) => api.delete<void>(`/authors/${id}`),
  scan: (id: number) => api.post<void>(`/scans/author/${id}`),
  coauthors: (id: number) => api.get<Coauthor[]>(`/authors/${id}/coauthors`),
}
