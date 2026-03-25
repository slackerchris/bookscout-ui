import { useQuery } from '@tanstack/react-query'
import { searchApi } from '@/lib/api/search'

export const searchStatusKeys = {
  status: ['search', 'status'] as const,
}

/**
 * Polls GET /api/v1/search/status every 30 seconds.
 * Returns Prowlarr, Jackett, and the active download client status in one call.
 */
export function useSearchStatus() {
  return useQuery({
    queryKey: searchStatusKeys.status,
    queryFn: searchApi.status,
    refetchInterval: 30_000,
  })
}
