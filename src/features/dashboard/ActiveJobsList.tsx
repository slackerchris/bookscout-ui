import { ActionStatusBadge } from '@/components/StatusBadge'
import { cn } from '@/lib/utils'
import type { Action, ActionType } from '@/types'
import { ScanLine, Search, Download, CheckCircle, EyeOff, RotateCcw, Activity } from 'lucide-react'

const typeConfig: Record<ActionType, { label: string; Icon: React.ElementType }> = {
  scan:       { label: 'Scan',        Icon: ScanLine },
  search:     { label: 'Search',      Icon: Search },
  download:   { label: 'Download',    Icon: Download },
  ignore:     { label: 'Ignore',      Icon: EyeOff },
  mark_owned: { label: 'Mark owned',  Icon: CheckCircle },
  retry:      { label: 'Retry',       Icon: RotateCcw },
}

interface Props {
  jobs: Action[]
}

export default function ActiveJobsList({ jobs }: Props) {
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
        <Activity size={20} className="opacity-40" />
        <p className="text-sm">No active jobs</p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-border">
      {jobs.map((job) => {
        const cfg = typeConfig[job.type] ?? { label: job.type, Icon: Activity }
        const isRunning = job.status === 'running'

        return (
          <li key={job.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <cfg.Icon
              size={14}
              className={cn(
                isRunning ? 'text-blue-500 animate-pulse' : 'text-muted-foreground',
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground">{cfg.label}</p>
              {job.message && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{job.message}</p>
              )}
            </div>
            <ActionStatusBadge status={job.status} />
          </li>
        )
      })}
    </ul>
  )
}
