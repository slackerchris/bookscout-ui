import { memo } from 'react'
import type { DownloadQueueItem } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Clock, HardDrive, AlertCircle, Library, FolderOpen } from 'lucide-react'
import { normalizeProgress, formatEta, formatBytes, statusDot, normalizeStatus } from './helpers'

const QueueRow = memo(function QueueRow({ item }: { item: DownloadQueueItem }) {
  const progress = normalizeProgress(item)
  const eta = formatEta(item.eta)
  const total = formatBytes(item.size)
  const dl = formatBytes(item.downloaded)
  const remaining = item.remaining ? `${item.remaining} MB left` : null
  const label = normalizeStatus(item.status)

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-border px-4 py-3 last:border-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('size-2 shrink-0 rounded-full', statusDot(item.status))} />
          <span className="truncate text-sm font-medium text-foreground">{item.title}</span>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {label}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="font-medium tabular-nums">{progress.toFixed(1)}%</span>
          {(dl || total) && (
            <span className="flex items-center gap-1">
              <HardDrive size={10} />
              {dl && total ? `${dl} / ${total}` : (total ?? dl)}
            </span>
          )}
          {remaining && <span>{remaining}</span>}
          {eta && (
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {eta}
            </span>
          )}
          {item.category && (
            <span className="inline-flex items-center gap-1">
              <Library size={10} />
              {item.category}
            </span>
          )}
          {item.save_path && (
            <span className="inline-flex items-center gap-1 truncate">
              <FolderOpen size={10} />
              <span className="truncate">{item.save_path}</span>
            </span>
          )}
        </div>
        {item.error && (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-destructive">
            <AlertCircle size={10} />
            {item.error}
          </p>
        )}
      </div>
      <div className="w-24 justify-self-end self-center">
        <div className="mb-1 text-right text-[11px] font-medium tabular-nums text-muted-foreground">
          {progress.toFixed(0)}%
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full transition-all', progress >= 100 ? 'bg-emerald-500' : 'bg-blue-500')}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
})

export default QueueRow
