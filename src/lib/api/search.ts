import { api } from './client'

export interface ServiceStatus {
  configured: boolean
  status?: 'ok' | 'error'
  version?: string
  detail?: string
}

export interface SearchStatusResult {
  indexers: {
    prowlarr: ServiceStatus
    jackett: ServiceStatus
  }
  download_client: Record<string, ServiceStatus>
}

export const searchApi = {
  status: () => api.get<SearchStatusResult>('/search/status'),
}
