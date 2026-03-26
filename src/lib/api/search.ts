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

/** A single result from POST /search/ (Prowlarr or Jackett) */
export interface SearchResult {
  title: string
  source: string       // "Prowlarr" | "Jackett"
  type: string         // "NZB" | "Torrent"
  size: number
  size_human: string
  indexer: string
  download_url: string
  magnet_url: string
  guid?: string
  seeders: number
  leechers?: number
  publish_date: string
}

export interface DownloadRequest {
  url: string
  title: string
  type?: string        // "nzb" | "torrent"
  category?: string
  save_path?: string
  book_id?: number
}

export interface DownloadQueueItem {
  name: string
  status: string
  progress: number     // 0–100
  eta?: number         // seconds remaining
  size?: number
  size_left?: number
  save_path?: string
}

export const searchApi = {
  status: () => api.get<SearchStatusResult>('/search/status'),
  search: (query: string) => api.post<SearchResult[]>('/search/', { query }),
  download: (body: DownloadRequest) =>
    api.post<{ success: boolean; detail?: string }>('/search/download', body),
  queue: () => api.get<DownloadQueueItem[]>('/search/download/queue'),
}
