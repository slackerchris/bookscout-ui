import { useQuery } from '@tanstack/react-query'
import { booksApi } from '@/lib/api/books'
import { authorsApi } from '@/lib/api/authors'

export const dashboardKeys = {
  missingCount: ['dashboard', 'count', 'missing'] as const,
  highConfidenceCount: ['dashboard', 'count', 'high-confidence'] as const,
  authorsCount: ['dashboard', 'count', 'authors'] as const,
  highConfidence: ['dashboard', 'high-confidence'] as const,
}

export function useMissingCounts() {
  const missing = useQuery({
    queryKey: dashboardKeys.missingCount,
    queryFn: () => booksApi.list({ missing_only: true }),
    refetchInterval: 60_000,
    select: (d) => d.length,
  })
  const highConf = useQuery({
    queryKey: dashboardKeys.highConfidenceCount,
    queryFn: () => booksApi.list({ missing_only: true, confidence_band: 'high' }),
    refetchInterval: 60_000,
    select: (d) => d.length,
  })
  const authors = useQuery({
    queryKey: dashboardKeys.authorsCount,
    queryFn: authorsApi.list,
    refetchInterval: 120_000,
    select: (d) => d.length,
  })
  return { missing, highConf, authors }
}

export function useHighConfidenceMissing() {
  return useQuery({
    queryKey: dashboardKeys.highConfidence,
    queryFn: () => booksApi.list({ missing_only: true, confidence_band: 'high' }),
  })
}
