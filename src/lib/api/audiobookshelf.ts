import { api } from './client'

export interface AbsImportResult {
  imported: number
  skipped: number
  total_from_abs: number
  imported_at?: string
}

export const audiobookshelfApi = {
  importAuthors: () => api.post<AbsImportResult>('/audiobookshelf/import-authors'),
  getImportResult: () => api.get<AbsImportResult | null>('/audiobookshelf/import-result'),
}
