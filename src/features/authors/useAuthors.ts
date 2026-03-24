import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authorsApi } from '@/lib/api/authors'

export const authorKeys = {
  all: ['authors'] as const,
  list: () => ['authors', 'list'] as const,
  detail: (id: string) => ['authors', 'detail', id] as const,
}

export function useAuthors() {
  return useQuery({
    queryKey: authorKeys.list(),
    queryFn: authorsApi.list,
  })
}

export function useAuthorMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: authorKeys.all })

  const add    = useMutation({ mutationFn: authorsApi.add,    onSuccess: invalidate })
  const remove = useMutation({ mutationFn: authorsApi.remove, onSuccess: invalidate })
  const scan   = useMutation({ mutationFn: authorsApi.scan,   onSuccess: invalidate })

  return { add, remove, scan }
}
