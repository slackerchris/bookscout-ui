import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { booksApi, type BooksParams } from '@/lib/api/books'

export const bookKeys = {
  all: ['books'] as const,
  list: (params: BooksParams) => ['books', 'list', params] as const,
  detail: (id: string) => ['books', 'detail', id] as const,
}

export function useBooks(params: BooksParams = {}) {
  return useQuery({
    queryKey: bookKeys.list(params),
    queryFn: () => booksApi.list(params),
  })
}

export function useBookAction() {
  const qc = useQueryClient()

  const invalidate = () => qc.invalidateQueries({ queryKey: bookKeys.all })

  const search   = useMutation({ mutationFn: booksApi.search,    onSuccess: invalidate })
  const download = useMutation({ mutationFn: booksApi.download,  onSuccess: invalidate })
  const ignore   = useMutation({ mutationFn: booksApi.ignore,    onSuccess: invalidate })
  const markOwned = useMutation({ mutationFn: booksApi.markOwned, onSuccess: invalidate })

  return { search, download, ignore, markOwned }
}
