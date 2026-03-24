import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ActionStatus } from '@/types'

// ---- Download / action status badges -------------------------------------

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

export function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const className =
    pct >= 90
      ? 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30'
      : pct >= 70
        ? 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30'
        : 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30'
  return (
    <Badge variant="outline" className={cn('tabular-nums font-normal', className)}>
      {pct}%
    </Badge>
  )
}

// ---- Owned / ignored / wanted pill ----------------------------------------

type BookState = 'owned' | 'ignored' | 'wanted' | 'missing'

const stateConfig: Record<BookState, { label: string; className: string }> = {
  owned:   { label: 'Owned',   className: 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30' },
  ignored: { label: 'Ignored', className: 'bg-zinc-500/15 text-zinc-500 border-zinc-500/30' },
  wanted:  { label: 'Wanted',  className: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30' },
  missing: { label: 'Missing', className: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30' },
}

export function BookStateBadge({ state }: { state: BookState }) {
  const cfg = stateConfig[state]
  return (
    <Badge variant="outline" className={cn('font-normal', cfg.className)}>
      {cfg.label}
    </Badge>
  )
}
