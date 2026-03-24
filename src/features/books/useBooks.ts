import { useQuery } from '@tanstack/react-query'
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
