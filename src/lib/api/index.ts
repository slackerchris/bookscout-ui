// Re-export the API clients for convenience.
export { api } from './client'
export { booksApi } from './books'
export { authorsApi } from './authors'
export { scansApi } from './scans'
export { audiobookshelfApi } from './audiobookshelf'
export type { AbsImportResult } from './audiobookshelf'
export { searchApi } from './search'
export type {
  SearchStatusResult,
  ServiceStatus,
  SearchResult,
  DownloadRequest,
  DownloadQueueItem,
} from './search'
export { n8nApi, N8N_WORKFLOW_ID } from './n8n'
export type { N8nExecution, N8nExecutionItem } from './n8n'
