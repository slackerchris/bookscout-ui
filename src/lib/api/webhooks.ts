import { api } from './client'

export interface Webhook {
  id: number
  url: string
  description: string | null
  events: string[] | null
  active: boolean
  failure_count: number
  disabled_at: string | null
  created_at: string
}

export interface WebhookCreate {
  url: string
  description?: string
  events?: string[]
}

export const webhooksApi = {
  list: () => api.get<Webhook[]>('/webhooks/'),
  create: (body: WebhookCreate) => api.post<Webhook>('/webhooks/', body),
  remove: (id: number) => api.delete<void>(`/webhooks/${id}`),
  reactivate: (id: number) => api.post<Webhook>(`/webhooks/${id}/reactivate`),
  test: (id: number) => api.post<{ success: boolean; status_code: number | null }>(`/webhooks/${id}/test`),
  deliveries: (id: number) => api.get<unknown[]>(`/webhooks/${id}/deliveries`),
}
