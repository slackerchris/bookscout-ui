import { useQuery } from '@tanstack/react-query'
import { statsApi, eventsApi, actionsApi } from '@/lib/api'
import { booksApi } from '@/lib/api/books'

export const dashboardKeys = {
  stats: ['dashboard', 'stats'] as const,
  recentEvents: ['dashboard', 'events'] as const,
  activeJobs: ['dashboard', 'jobs'] as const,
  highConfidence: ['dashboard', 'high-confidence'] as const,
}

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats,
    queryFn: statsApi.get,
    refetchInterval: 30_000,
  })
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
    queryFn: () => booksApi.list({ owned: false, ignored: false, page_size: 8 }),
    select: (data) => ({
      ...data,
      items: data.items
        .filter((b) => b.confidence >= 0.85)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 8),
    }),
  })
}
