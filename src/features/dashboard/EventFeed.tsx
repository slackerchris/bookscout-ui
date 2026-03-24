import { cn } from '@/lib/utils'
import type { BookScoutEvent } from '@/types'
import { CheckCircle2, Users, Activity } from 'lucide-react'

interface EventConfig {
  label: string
  Icon: React.ElementType
  className: string
}

const eventConfig: Record<string, EventConfig> = {
  'scan.complete':        { label: 'Scan complete',       Icon: CheckCircle2, className: 'text-green-500' },
  'coauthor.discovered':  { label: 'Coauthor discovered', Icon: Users,        className: 'text-blue-400' },
}

function getConfig(eventType: string): EventConfig {
  return eventConfig[eventType] ?? { label: eventType, Icon: Activity, className: 'text-zinc-400' }
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
  if (event.event_type === 'scan.complete') {
    const name = p.author_name
    const newBooks = typeof p.new_books === 'number' ? p.new_books : null
    if (name) return `${name}${newBooks !== null ? ` — ${newBooks} new book${newBooks !== 1 ? 's' : ''}` : ''}`
  }
  if (event.event_type === 'coauthor.discovered') {
    const name = p.author_name
    const coauthors = Array.isArray(p.coauthors) ? (p.coauthors as string[]).join(', ') : ''
    if (name && coauthors) return `${name}: ${coauthors}`
    if (name) return String(name)
  }
  if (typeof p.message === 'string') return p.message
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
        const cfg = getConfig(event.event_type)
        const summary = payloadSummary(event)

        return (
          <li key={event._clientId ?? event.timestamp} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
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
