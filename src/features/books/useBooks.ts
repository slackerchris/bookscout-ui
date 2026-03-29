import { useQuery } from '@tanstack/react-query'
import { booksApi, type BooksParams, type BooksCountParams } from '@/lib/api/books'

export const bookKeys = {
  all: ['books'] as const,
  lists: () => ['books', 'list'] as const,
  list: (params: BooksParams) => ['books', 'list', params] as const,
  counts: () => ['books', 'count'] as const,
  count: (params: BooksCountParams) => ['books', 'count', params] as const,
  detail: (id: string) => ['books', 'detail', id] as const,
}

export function useBooks(params: BooksParams = {}) {
  return useQuery({
    queryKey: bookKeys.list(params),
    queryFn: () => booksApi.list(params),
  })
}

export function useBooksCount(params: BooksCountParams = {}) {
  return useQuery({
    queryKey: bookKeys.count(params),
    queryFn: () => booksApi.count(params),
    select: (d) => d.count,
  })
}
