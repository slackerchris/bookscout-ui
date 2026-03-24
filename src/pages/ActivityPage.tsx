import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { actionsApi, eventsApi } from '@/lib/api'
import { useBookScoutSSE } from '@/lib/sse/useBookScoutSSE'
import { ActionStatusBadge } from '@/components/StatusBadge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { BookScoutEvent, ActionType, EventType } from '@/types'
import {
  ScanLine,
  Search,
  Download,
  CheckCircle,
  EyeOff,
  RotateCcw,
  Activity,
  Zap,
  CheckCircle2,
  Bell,
  BookX,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'

// ---- Shared ---------------------------------------------------------------

function RelativeTime({ iso }: { iso: string }) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(diff / 86_400_000)
  if (m < 1) return <span className="text-muted-foreground/60">just now</span>
  if (m < 60) return <span className="text-muted-foreground/60">{m}m ago</span>
  if (h < 24) return <span className="text-muted-foreground/60">{h}h ago</span>
  return <span className="text-muted-foreground/60">{d}d ago</span>
}

// ---- Pagination -----------------------------------------------------------

function Pagination({ page, total, pageSize, onPageChange }: {
  page: number; total: number; pageSize: number; onPageChange: (p: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>{total} total</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft size={14} />
        </Button>
        <span className="px-2 tabular-nums">{page} / {totalPages}</span>
        <Button variant="ghost" size="icon-sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  )
}

// ---- Jobs tab -------------------------------------------------------------

const actionTypeConfig: Record<ActionType, { label: string; Icon: React.ElementType }> = {
  scan:       { label: 'Scan',       Icon: ScanLine },
  search:     { label: 'Search',     Icon: Search },
  download:   { label: 'Download',   Icon: Download },
  ignore:     { label: 'Ignore',     Icon: EyeOff },
  mark_owned: { label: 'Mark owned', Icon: CheckCircle },
  retry:      { label: 'Retry',      Icon: RotateCcw },
}

function JobsTab() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useQuery({
    queryKey: ['activity', 'jobs', page],
    queryFn: () => actionsApi.list(page),
  })

  useBookScoutSSE((event: BookScoutEvent) => {
    const relevant: BookScoutEvent['event_type'][] = [
      'download_queued', 'download_completed', 'scan_started',
      'scan_completed', 'action_failed',
    ]
    if (relevant.includes(event.event_type)) {
      qc.invalidateQueries({ queryKey: ['activity', 'jobs'] })
    }
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
      <Loader2 size={16} className="animate-spin" /><span className="text-sm">Loading…</span>
    </div>
  )
  if (isError) return (
    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      Failed to load jobs.
    </div>
  )
  if (!data?.items.length) return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
      <Activity size={24} className="opacity-30" /><p className="text-sm">No jobs yet.</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[110px]">Type</TableHead>
              <TableHead>Target</TableHead>
              <TableHead className="w-[110px]">Status</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="w-[100px]">Started</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((job) => {
              const cfg = actionTypeConfig[job.type] ?? { label: job.type, Icon: Activity }
              return (
                <TableRow key={job.id}>
                  <TableCell>
                    <span className="flex items-center gap-1.5 text-sm text-foreground">
                      <cfg.Icon size={13} className="text-muted-foreground shrink-0" />
                      {cfg.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    <span className="capitalize">{job.target_type}</span>
                    {job.external_ref && (
                      <span className="ml-1.5 font-mono text-xs opacity-60">{job.external_ref}</span>
                    )}
                  </TableCell>
                  <TableCell><ActionStatusBadge status={job.status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[280px] truncate">
                    {job.message ?? <span className="opacity-40">—</span>}
                  </TableCell>
                  <TableCell><RelativeTime iso={job.started_at} /></TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <Pagination page={page} total={data.total} pageSize={data.page_size} onPageChange={setPage} />
    </div>
  )
}

// ---- Events tab -----------------------------------------------------------

const eventConfig: Record<EventType, { label: string; Icon: React.ElementType; className: string }> = {
  scan_started:       { label: 'Scan started',      Icon: ScanLine,     className: 'text-blue-500' },
  scan_completed:     { label: 'Scan completed',     Icon: CheckCircle2, className: 'text-green-500' },
  search_sent:        { label: 'Search sent',        Icon: Search,       className: 'text-blue-400' },
  download_queued:    { label: 'Download queued',    Icon: Download,     className: 'text-blue-500' },
  download_completed: { label: 'Download complete',  Icon: CheckCircle2, className: 'text-green-500' },
  action_failed:      { label: 'Action failed',      Icon: AlertCircle,  className: 'text-red-500' },
  notification_sent:  { label: 'Notification sent', Icon: Bell,         className: 'text-zinc-400' },
  missing_book_found: { label: 'Missing book found', Icon: BookX,        className: 'text-orange-500' },
}

function EventsTab() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useQuery({
    queryKey: ['activity', 'events', page],
    queryFn: () => eventsApi.list(page),
    refetchInterval: 15_000,
  })

  useBookScoutSSE(() => {
    qc.invalidateQueries({ queryKey: ['activity', 'events'] })
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
      <Loader2 size={16} className="animate-spin" /><span className="text-sm">Loading…</span>
    </div>
  )
  if (isError) return (
    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      Failed to load events.
    </div>
  )
  if (!data?.items.length) return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
      <Zap size={24} className="opacity-30" /><p className="text-sm">No events yet.</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[160px]">Event</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="w-[100px]">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((event) => {
              const cfg = eventConfig[event.event_type] ?? { label: event.event_type, Icon: Activity, className: 'text-zinc-400' }
              const p = event.payload
              const detail = p.title
                ? `${p.title}${p.author ? ` — ${p.author}` : ''}`
                : p.message ?? p.name ?? null

              return (
                <TableRow key={event.id}>
                  <TableCell>
                    <span className="flex items-center gap-1.5 text-sm text-foreground">
                      <cfg.Icon size={13} className={cn('shrink-0', cfg.className)} />
                      {cfg.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[360px] truncate">
                    {detail ? String(detail) : <span className="opacity-40">—</span>}
                  </TableCell>
                  <TableCell><RelativeTime iso={event.timestamp} /></TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <Pagination page={page} total={data.total} pageSize={data.page_size} onPageChange={setPage} />
    </div>
  )
}

// ---- Page -----------------------------------------------------------------

type Tab = 'jobs' | 'events'

export default function ActivityPage() {
  const [tab, setTab] = useState<Tab>('jobs')

  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold text-foreground">Activity</h1>

      <div className="flex gap-1 border-b border-border">
        {(['jobs', 'events'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-3 pb-2 text-sm capitalize transition-colors',
              tab === t
                ? 'border-b-2 border-foreground text-foreground font-medium -mb-px'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'jobs'   && <JobsTab />}
      {tab === 'events' && <EventsTab />}
    </div>
  )
}
