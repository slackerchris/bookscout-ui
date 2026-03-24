import { useState, useCallback, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useBookScoutSSE } from '@/lib/sse/useBookScoutSSE'
import { scansApi } from '@/lib/api'
import type { BookScoutEvent } from '@/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CheckCircle2, Users, Activity, ScanLine, Loader2, Trash2 } from 'lucide-react'

// ---- Event config ---------------------------------------------------------

interface EventConfig {
  label: string
  Icon: React.ElementType
  className: string
}

const EVENT_CONFIG: Record<string, EventConfig> = {
  'scan.complete':        { label: 'Scan complete',       Icon: CheckCircle2, className: 'text-green-500' },
  'coauthor.discovered':  { label: 'Coauthor discovered', Icon: Users,        className: 'text-blue-400' },
}

function getEventConfig(eventType: string): EventConfig {
  return EVENT_CONFIG[eventType] ?? { label: eventType, Icon: Activity, className: 'text-zinc-400' }
}

// ---- Payload summary ------------------------------------------------------

function payloadSummary(event: BookScoutEvent): string | null {
  const p = event.payload
  if (!p || typeof p !== 'object') return null

  if (event.event_type === 'scan.complete') {
    const name = typeof p.author_name === 'string' ? p.author_name : null
    const newBooks = typeof p.new_books === 'number' ? p.new_books : null
    if (name) {
      return newBooks !== null
        ? `${name} — ${newBooks} new book${newBooks !== 1 ? 's' : ''}`
        : name
    }
  }

  if (event.event_type === 'coauthor.discovered') {
    const name = typeof p.author_name === 'string' ? p.author_name : null
    const coauthors = Array.isArray(p.coauthors)
      ? (p.coauthors as string[]).join(', ')
      : null
    if (name && coauthors) return `${name}: ${coauthors}`
    if (name) return name
  }

  if (typeof p.message === 'string') return p.message
  return null
}

// ---- Relative time --------------------------------------------------------

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

// ---- Page -----------------------------------------------------------------

export default function ActivityPage() {
  const [events, setEvents] = useState<BookScoutEvent[]>([])
  const clientSeq = useRef(0)
  const scanAll = useMutation({ mutationFn: scansApi.scanAll })

  const handleEvent = useCallback((event: BookScoutEvent) => {
    setEvents((prev) =>
      [{ ...event, _clientId: String(++clientSeq.current) }, ...prev].slice(0, 200),
    )
  }, [])

  useBookScoutSSE(handleEvent)

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Activity</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Live event stream
            <span className="ml-2 inline-block size-1.5 rounded-full bg-green-500 animate-pulse align-middle" title="Connected" />
          </p>
        </div>
        <div className="flex items-center gap-2">
          {events.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setEvents([])}>
              <Trash2 size={13} />
              Clear
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={scanAll.isPending}
            onClick={() => scanAll.mutate()}
          >
            {scanAll.isPending
              ? <Loader2 size={13} className="animate-spin" />
              : <ScanLine size={13} />}
            Scan all authors
          </Button>
        </div>
      </div>

      {scanAll.isSuccess && (
        <div className="rounded-md border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm text-green-700 dark:text-green-400">
          Scan queued — job ID: <span className="font-mono">{scanAll.data?.job_id}</span>
        </div>
      )}

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
          <Activity size={28} className="opacity-30" />
          <p className="text-sm">Waiting for events…</p>
          <p className="text-xs opacity-60">Events appear here in real-time as BookScout scans run.</p>
        </div>
      ) : (
        <div className="rounded-md border border-border divide-y divide-border">
          {events.map((event) => {
            const cfg = getEventConfig(event.event_type)
            const summary = payloadSummary(event)
            return (
              <div
                key={event._clientId}
                className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className={cn('mt-0.5 shrink-0', cfg.className)}>
                  <cfg.Icon size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-none text-foreground">{cfg.label}</p>
                  {summary && (
                    <p className="mt-1 text-xs text-muted-foreground truncate">{summary}</p>
                  )}
                </div>
                <RelativeTime iso={event.timestamp} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
