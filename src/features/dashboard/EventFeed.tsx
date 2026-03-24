import { cn } from '@/lib/utils'
import type { BookScoutEvent, EventType } from '@/types'
import {
  ScanLine,
  CheckCircle2,
  Search,
  Download,
  AlertCircle,
  Bell,
  BookX,
  Activity,
} from 'lucide-react'

const eventConfig: Record<
  EventType,
  { label: string; Icon: React.ElementType; className: string }
> = {
  scan_started:       { label: 'Scan started',       Icon: ScanLine,     className: 'text-blue-500' },
  scan_completed:     { label: 'Scan completed',      Icon: CheckCircle2, className: 'text-green-500' },
  search_sent:        { label: 'Search sent',         Icon: Search,       className: 'text-blue-400' },
  download_queued:    { label: 'Download queued',     Icon: Download,     className: 'text-blue-500' },
  download_completed: { label: 'Download complete',   Icon: CheckCircle2, className: 'text-green-500' },
  action_failed:      { label: 'Action failed',       Icon: AlertCircle,  className: 'text-red-500' },
  notification_sent:  { label: 'Notification sent',  Icon: Bell,         className: 'text-zinc-400' },
  missing_book_found: { label: 'Missing book found',  Icon: BookX,        className: 'text-orange-500' },
}

function RelativeTime({ iso }: { iso: string }) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(diff / 86_400_000)
  if (m < 1) return <span>just now</span>
  if (m < 60) return <span>{m}m ago</span>
  if (h < 24) return <span>{h}h ago</span>
  return <span>{d}d ago</span>
}

function payloadSummary(event: BookScoutEvent): string | null {
  const p = event.payload
  if (!p || typeof p !== 'object') return null
  const title = p.title ?? p.book_title ?? p.name
  const author = p.author ?? p.author_name
  if (title && author) return `${title} — ${author}`
  if (title) return String(title)
  if (p.message) return String(p.message)
  return null
}

interface Props {
  events: BookScoutEvent[]
}

export default function EventFeed({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
        <Activity size={20} className="opacity-40" />
        <p className="text-sm">No recent events</p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-border">
      {events.map((event) => {
        const cfg = eventConfig[event.event_type] ?? {
          label: event.event_type,
          Icon: Activity,
          className: 'text-zinc-400',
        }
        const summary = payloadSummary(event)

        return (
          <li key={event.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <div className={cn('mt-0.5 shrink-0', cfg.className)}>
              <cfg.Icon size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-none text-foreground">{cfg.label}</p>
              {summary && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{summary}</p>
              )}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground/60">
              <RelativeTime iso={event.timestamp} />
            </span>
          </li>
        )
      })}
    </ul>
  )
}
