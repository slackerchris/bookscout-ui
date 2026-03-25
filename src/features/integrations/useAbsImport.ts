import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { audiobookshelfApi, type AbsImportResult } from '@/lib/api/audiobookshelf'

const STORAGE_KEY = 'abs_import_result'

export interface StoredAbsResult extends AbsImportResult {
  imported_at: string
}

function readStored(): StoredAbsResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredAbsResult) : null
  } catch {
    return null
  }
}

function writeStored(result: StoredAbsResult): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(result))
}

export const absImportKeys = {
  result: ['abs', 'import', 'result'] as const,
}

/** Reads the last import result from localStorage into the Query cache. */
export function useAbsImportResult() {
  return useQuery({
    queryKey: absImportKeys.result,
    queryFn: readStored,
    // localStorage doesn't go stale on its own; only invalidate explicitly.
    staleTime: Infinity,
  })
}

/** Runs the import, persists the result to localStorage, and syncs the cache. */
export function useAbsImport() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: audiobookshelfApi.importAuthors,
    onSuccess: (result: AbsImportResult) => {
      const stored: StoredAbsResult = { ...result, imported_at: new Date().toISOString() }
      writeStored(stored)
      qc.setQueryData(absImportKeys.result, stored)
    },
  })
}
