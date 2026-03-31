import { useQuery } from '@tanstack/react-query'
import { booksApi } from '@/lib/api/books'
import { authorsApi } from '@/lib/api/authors'

export const dashboardKeys = {
  missingCount: ['dashboard', 'count', 'missing'] as const,
  highConfidenceCount: ['dashboard', 'count', 'high-confidence'] as const,
  authorsCount: ['dashboard', 'count', 'authors'] as const,
  totalAuthorsCount: ['dashboard', 'count', 'authors-total'] as const,
}

export function useMissingCounts() {
  const missing = useQuery({
    queryKey: dashboardKeys.missingCount,
    queryFn: () => booksApi.count({ missing_only: true }),
    refetchInterval: 5 * 60_000,
    staleTime: 4 * 60_000,
    select: (d) => d.count,
  })
  const highConf = useQuery({
    queryKey: dashboardKeys.highConfidenceCount,
    queryFn: () => booksApi.count({ missing_only: true, confidence_band: 'high' }),
    refetchInterval: 5 * 60_000,
    staleTime: 4 * 60_000,
    select: (d) => d.count,
  })
  const authors = useQuery({
    queryKey: dashboardKeys.authorsCount,
    queryFn: () => authorsApi.count(),
    refetchInterval: 5 * 60_000,
    staleTime: 4 * 60_000,
    select: (d) => d.count,
  })
  const totalAuthors = useQuery({
    queryKey: dashboardKeys.totalAuthorsCount,
    queryFn: () => authorsApi.count({ watched_only: false }),
    refetchInterval: 5 * 60_000,
    staleTime: 4 * 60_000,
    select: (d) => d.count,
  })
  return { missing, highConf, authors, totalAuthors }
}
