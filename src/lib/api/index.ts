import type { Action, BookScoutEvent, IntegrationStatus, DashboardStats, Paginated } from '@/types'
import { api } from './client'

export const statsApi = {
  get: () => api.get<DashboardStats>('/stats'),
}

export const actionsApi = {
  list: (page = 1) => api.get<Paginated<Action>>(`/actions?page=${page}`),
}

export const eventsApi = {
  list: (page = 1) => api.get<Paginated<BookScoutEvent>>(`/events?page=${page}`),
}

export const integrationsApi = {
  list: () => api.get<IntegrationStatus[]>('/integrations'),
  check: (service: string) => api.post<IntegrationStatus>(`/integrations/${service}/check`),
}
