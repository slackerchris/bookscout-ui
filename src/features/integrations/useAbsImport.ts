import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { audiobookshelfApi, type AbsImportResult } from '@/lib/api/audiobookshelf'
import { authorKeys } from '@/features/authors/useAuthors'

export interface StoredAbsResult extends AbsImportResult {
  imported_at: string
}

export const absImportKeys = {
  result: ['abs', 'import', 'result'] as const,
}

/** Fetches the last import result from the backend (survives page reloads and DB wipes). */
export function useAbsImportResult() {
  return useQuery({
    queryKey: absImportKeys.result,
    queryFn: () => audiobookshelfApi.getImportResult(),
    staleTime: Infinity,
  })
}

/** Runs the import, stores the result server-side, and refreshes the authors list. */
export function useAbsImport() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: audiobookshelfApi.importAuthors,
    onSuccess: (result: AbsImportResult) => {
      // Update the import result cache from the response (backend already persisted it).
      qc.setQueryData(absImportKeys.result, result)
      // Refresh the authors list so newly imported authors appear immediately.
      qc.invalidateQueries({ queryKey: authorKeys.list() })
    },
  })
}
