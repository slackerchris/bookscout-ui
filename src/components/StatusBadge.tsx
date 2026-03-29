import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// ---- Download / action status badges -------------------------------------

type ActionStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled'

const statusConfig: Record<ActionStatus, { label: string; className: string }> = {
  pending:   { label: 'Pending',   className: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30' },
  running:   { label: 'Running',   className: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30' },
  success:   { label: 'Done',      className: 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30' },
  failed:    { label: 'Failed',    className: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30' },
  cancelled: { label: 'Cancelled', className: 'bg-zinc-500/15 text-zinc-500 border-zinc-500/30' },
}

export function ActionStatusBadge({ status }: { status: ActionStatus }) {
  const cfg = statusConfig[status]
  return (
    <Badge variant="outline" className={cn('font-normal', cfg.className)}>
      {cfg.label}
    </Badge>
  )
}

// ---- Confidence badge -----------------------------------------------------

export function ConfidenceBadge({ band, score, reasons }: { band: 'high' | 'medium' | 'low'; score: number; reasons?: string | null }) {
  const className =
    band === 'high'
      ? 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30'
      : band === 'medium'
        ? 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30'
        : 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30'
  const label = band.charAt(0).toUpperCase() + band.slice(1)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className={cn('font-normal cursor-default', className)}>
          {label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        <p className="font-medium mb-1">Score: {score}</p>
        {reasons && (() => {
          let items: string[] = []
          try { items = JSON.parse(reasons) } catch { items = [reasons] }
          return (
            <ul className="text-xs opacity-80 space-y-0.5">
              {items.map((r) => (
                <li key={r}>· {r.replace(/_/g, ' ')}</li>
              ))}
            </ul>
          )
        })()}
      </TooltipContent>
    </Tooltip>
  )
}

// ---- Book state pill -------------------------------------------------------

type BookState = 'have_it' | 'missing' | 'unknown'

const stateConfig: Record<BookState, { label: string; className: string }> = {
  have_it: { label: 'Have it', className: 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30' },
  missing: { label: 'Missing', className: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30' },
  unknown: { label: 'Unknown', className: 'bg-zinc-500/15 text-zinc-500 border-zinc-500/30' },
}

export function BookStateBadge({ state }: { state: BookState }) {
  const cfg = stateConfig[state]
  return (
    <Badge variant="outline" className={cn('font-normal', cfg.className)}>
      {cfg.label}
    </Badge>
  )
}
