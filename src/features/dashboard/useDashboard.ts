import { useQuery } from '@tanstack/react-query'
import { eventsApi, actionsApi } from '@/lib/api'
import { booksApi } from '@/lib/api/books'
import { authorsApi } from '@/lib/api/authors'

export const dashboardKeys = {
  missingCount: ['dashboard', 'count', 'missing'] as const,
  highConfidenceCount: ['dashboard', 'count', 'high-confidence'] as const,
  authorsCount: ['dashboard', 'count', 'authors'] as const,
  recentEvents: ['dashboard', 'events'] as const,
  activeJobs: ['dashboard', 'jobs'] as const,
  highConfidence: ['dashboard', 'high-confidence'] as const,
}

export function useMissingCounts() {
  const missing = useQuery({
    queryKey: dashboardKeys.missingCount,
    queryFn: () => booksApi.list({ missing_only: true, page_size: 1 }),
    refetchInterval: 60_000,
    select: (d) => d.total,
  })
  const highConf = useQuery({
    queryKey: dashboardKeys.highConfidenceCount,
    queryFn: () => booksApi.list({ missing_only: true, confidence_band: 'high', page_size: 1 }),
    refetchInterval: 60_000,
    select: (d) => d.total,
  })
  const authors = useQuery({
    queryKey: dashboardKeys.authorsCount,
    queryFn: authorsApi.list,
    refetchInterval: 120_000,
    select: (d) => d.length,
  })
  return { missing, highConf, authors }
}

export function useRecentEvents() {
  return useQuery({
    queryKey: dashboardKeys.recentEvents,
    queryFn: () => eventsApi.list(1),
    refetchInterval: 15_000,
  })
}

export function useActiveJobs() {
  return useQuery({
    queryKey: dashboardKeys.activeJobs,
    queryFn: () => actionsApi.list(1),
    refetchInterval: 10_000,
    select: (data) => ({
      ...data,
      items: data.items.filter((a) => a.status === 'pending' || a.status === 'running'),
    }),
  })
}

export function useHighConfidenceMissing() {
  return useQuery({
    queryKey: dashboardKeys.highConfidence,
    queryFn: () => booksApi.list({ missing_only: true, confidence_band: 'high', page_size: 8 }),
  })
}
