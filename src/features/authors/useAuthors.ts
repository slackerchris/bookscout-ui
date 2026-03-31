import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authorsApi } from '@/lib/api/authors'

export const authorKeys = {
  all: ['authors'] as const,
  list: () => ['authors', 'list'] as const,
  unwatched: () => ['authors', 'unwatched'] as const,
  detail: (id: number) => ['authors', 'detail', id] as const,
  coauthors: (id: number) => ['authors', 'coauthors', id] as const,
}

export function useAuthors() {
  return useQuery({
    queryKey: authorKeys.list(),
    queryFn: () => authorsApi.list(),
  })
}

export function useUnwatchedAuthors(enabled = true) {
  return useQuery({
    queryKey: authorKeys.unwatched(),
    queryFn: () => authorsApi.unwatched(),
    enabled,
  })
}

export function useAuthorDetail(id: number) {
  return useQuery({
    queryKey: authorKeys.detail(id),
    queryFn: () => authorsApi.get(id),
    enabled: !isNaN(id),
  })
}

export function useCoauthors(authorId: number | null) {
  return useQuery({
    queryKey: authorId !== null
      ? authorKeys.coauthors(authorId)
      : (['authors', 'coauthors', '__disabled__'] as const),
    queryFn: () => authorsApi.coauthors(authorId!),
    enabled: authorId !== null,
  })
}

export function useAuthorMutations() {
  const qc = useQueryClient()

  // add: only affects the watched list (new author is added to watch immediately)
  const add = useMutation({
    mutationFn: authorsApi.add,
    onSuccess: () => qc.invalidateQueries({ queryKey: authorKeys.list() }),
  })

  // remove: affects watched list, unwatched list, and favorites (removed author may be favorited).
  // Coauthor caches for other authors are not affected.
  const remove = useMutation({
    mutationFn: authorsApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authorKeys.list() })
      qc.invalidateQueries({ queryKey: authorKeys.unwatched() })
      qc.invalidateQueries({ queryKey: ['authors', 'favorites'] })
    },
  })

  // scan: enqueues a background job — only invalidate the list (last_scanned timestamp)
  const scan = useMutation({
    mutationFn: authorsApi.scan,
    onSuccess: () => qc.invalidateQueries({ queryKey: authorKeys.list() }),
  })

  // watch: author moves from unwatched to watched
  const watch = useMutation({
    mutationFn: authorsApi.watch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authorKeys.list() })
      qc.invalidateQueries({ queryKey: authorKeys.unwatched() })
    },
  })

  return { add, remove, scan, watch }
}
