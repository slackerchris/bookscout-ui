import type { Author } from '@/types'
import { api } from './client'

export const authorsApi = {
  list: () => api.get<Author[]>('/authors'),
  get: (id: string) => api.get<Author>(`/authors/${id}`),
  add: (name: string) => api.post<Author>('/authors', { name }),
  remove: (id: string) => api.delete<void>(`/authors/${id}`),
  scan: (id: string) => api.post<void>(`/authors/${id}/scan`),
}
