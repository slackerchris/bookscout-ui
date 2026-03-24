import { api } from './client'

export interface AbsImportResult {
  imported: number
  skipped: number
  total_from_abs: number
}

export const audiobookshelfApi = {
  importAuthors: () => api.post<AbsImportResult>('/audiobookshelf/import-authors'),
}
