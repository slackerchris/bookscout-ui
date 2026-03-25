import { useQuery } from '@tanstack/react-query'

interface HealthResponse {
  status: 'ok' | 'degraded'
  version: string
  components: Record<string, string>
}

async function fetchHealth(): Promise<HealthResponse | null> {
  try {
    const res = await fetch('/health')
    if (!res.ok) return null
    return res.json() as Promise<HealthResponse>
  } catch {
    return null
  }
}

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    staleTime: 60_000,
    refetchInterval: 60_000,
  })
}
