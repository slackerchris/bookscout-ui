import { useQueryClient, useQuery } from '@tanstack/react-query'
import {
  useMissingCounts,
  dashboardKeys,
} from '@/features/dashboard/useDashboard'
import { StatCard } from '@/features/dashboard/StatCard'
import { useBookScoutSSE } from '@/lib/sse/useBookScoutSSE'
import { useHealth } from '@/hooks/useHealth'
import { useSearchStatus } from '@/features/integrations/useSearchStatus'
import { searchApi } from '@/lib/api/search'
import type { ServiceStatus } from '@/lib/api/search'
import type { BookScoutEvent } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookX, Zap, Users, Circle, Loader2, Download } from 'lucide-react'

// ── Service health dot ─────────────────────────────────────────────────────

function ServiceDot({ label, svc, loading }: { label: string; svc?: ServiceStatus; loading: boolean }) {
  if (loading) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 size={10} className="animate-spin" />
        {label}
      </span>
    )
  }
  if (!svc || !svc.configured) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground/40">
        <Circle size={7} className="fill-muted-foreground/30" />
        {label}
      </span>
    )
  }
  if (svc.status === 'ok') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Circle size={7} className="fill-emerald-500 text-emerald-500" />
        {label}
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-destructive">
      <Circle size={7} className="fill-destructive" />
      {label}
    </span>
  )
}

// ── ETA formatter ──────────────────────────────────────────────────────────

function formatEta(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${Math.floor(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`
}

// ── qBittorrent / SABnzbd status normaliser ────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  stalledup: 'Stalled',
  stalledDL: 'Stalled (DL)',
  forcedup: 'Seeding',
  uploading: 'Seeding',
  downloading: 'Downloading',
  checkingup: 'Checking',
  checkingdl: 'Checking',
  pausedup: 'Paused',
  pauseddl: 'Paused',
  queuedup: 'Queued',
  queueddl: 'Queued',
  moving: 'Moving',
  error: 'Error',
  missingfiles: 'Missing Files',
  // SABnzbd
  paused: 'Paused',
  extracting: 'Extracting',
  completed: 'Done',
}

function normaliseStatus(raw: string): string {
  return STATUS_LABEL[raw.toLowerCase()] ?? (raw.charAt(0).toUpperCase() + raw.slice(1))
}

function statusColor(raw: string): string {
  const s = raw.toLowerCase()
  if (s === 'error' || s.includes('missing')) return 'text-destructive'
  if (s.includes('downloading') || s === 'extracting') return 'text-emerald-500'
  return 'text-muted-foreground'
}

function barColor(raw: string): string {
  const s = raw.toLowerCase()
  if (s === 'error' || s.includes('missing')) return 'bg-destructive/70'
  if (s.includes('downloading') || s === 'extracting') return 'bg-emerald-500'
  return 'bg-muted-foreground/30'
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const qc = useQueryClient()
  const counts = useMissingCounts()
  const { data: health, isLoading: healthLoading } = useHealth()
  const { data: searchStatus, isLoading: statusLoading } = useSearchStatus()
  const { data: queue, isLoading: queueLoading } = useQuery({
    queryKey: ['download', 'queue'],
    queryFn: searchApi.queue,
    refetchInterval: 15_000,
  })

  const bookscoutStatus: ServiceStatus | undefined = health
    ? { configured: true, status: health.status === 'ok' ? 'ok' : 'error', version: health.version }
    : undefined

  const prowlarr = searchStatus?.indexers.prowlarr
  const jackett = searchStatus?.indexers.jackett
  const dlEntry = searchStatus?.download_client
    ? Object.entries(searchStatus.download_client)[0]
    : null
  const dlLabel = dlEntry
    ? ({ sabnzbd: 'SABnzbd', qbittorrent: 'qBittorrent', transmission: 'Transmission' }[dlEntry[0]] ?? dlEntry[0])
    : 'Downloader'
  const dlStatus = dlEntry?.[1]

  // Live: refresh relevant queries when a scan completes
  useBookScoutSSE((event: BookScoutEvent) => {
    if (event.event_type === 'scan.complete') {
      qc.invalidateQueries({ queryKey: dashboardKeys.missingCount })
      qc.invalidateQueries({ queryKey: dashboardKeys.highConfidenceCount })
    }
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">BookScout control panel</p>
      </div>

      {/* Service health bar */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-border bg-muted/30 px-4 py-2.5">
        <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wide">Services</span>
        <ServiceDot label="BookScout API" svc={bookscoutStatus} loading={healthLoading} />
        <ServiceDot label="Prowlarr" svc={prowlarr} loading={statusLoading} />
        <ServiceDot label="Jackett" svc={jackett} loading={statusLoading} />
        <ServiceDot label={dlLabel} svc={dlStatus} loading={statusLoading} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Missing books"
          value={counts.missing.data}
          icon={BookX}
          loading={counts.missing.isLoading}
        />
        <StatCard
          label="High confidence"
          value={counts.highConf.data}
          icon={Zap}
          loading={counts.highConf.isLoading}
          iconClassName="bg-orange-500/10"
        />
        <StatCard
          label="Authors tracked"
          value={counts.authors.data}
          icon={Users}
          loading={counts.authors.isLoading}
          iconClassName="bg-blue-500/10"
        />
      </div>

      {/* Active downloads */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download size={14} className="text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Active Downloads</CardTitle>
            </div>
            {!!queue?.length && (
              <span className="text-xs text-muted-foreground">{queue.length} item{queue.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {queueLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-1.5 w-full animate-pulse rounded-full bg-muted" />
                </div>
              ))}
            </div>
          ) : !queue?.length ? (
            <p className="text-sm text-muted-foreground py-3">No active downloads.</p>
          ) : (
            <div className="max-h-72 overflow-y-auto -mx-1 px-1">
              <div className="flex flex-col gap-3">
                {queue.map((item, i) => {
                  const label = normaliseStatus(item.status)
                  const showEta = item.eta !== undefined && item.eta > 0 && item.eta < 86_400 && item.progress < 100
                  return (
                    <div key={i} className="flex flex-col gap-1">
                      <div className="flex min-w-0 items-center justify-between gap-3">
                        <span className="min-w-0 flex-1 truncate text-sm text-foreground" title={item.name}>
                          {item.name}
                        </span>
                        <div className="flex shrink-0 items-center gap-2 text-xs">
                          <span className="tabular-nums text-muted-foreground">{item.progress.toFixed(0)}%</span>
                          {showEta && (
                            <span className="tabular-nums text-muted-foreground">{formatEta(item.eta!)}</span>
                          )}
                          <span className={statusColor(item.status)}>{label}</span>
                        </div>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${barColor(item.status)}`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
