import type { Action, BookScoutEvent, Paginated } from '@/types'
import { api } from './client'

export const actionsApi = {
  list: (page = 1) => api.get<Paginated<Action>>(`/actions?page=${page}`),
}

export const eventsApi = {
  list: (page = 1) => api.get<Paginated<BookScoutEvent>>(`/events?page=${page}`),
}
