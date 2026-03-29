import { useQuery } from '@tanstack/react-query'
import { searchApi, booksApi } from '@/lib/api'
import type { DownloadQueueItem } from '@/lib/api'
import type { Book } from '@/types'
import { cn } from '@/lib/utils'
import {
  Download, CheckCircle2, Clock, AlertCircle, Loader2,
  HardDrive, RefreshCw,
} from 'lucide-react'

// ── Helpers ────────────────────────────────────────────────────────────────

function normalizeProgress(item: DownloadQueueItem): number {
  if (item.progress !== undefined) return Math.min(100, Math.max(0, item.progress))
  if (item.percentage !== undefined) return Math.min(100, Math.max(0, parseFloat(item.percentage) || 0))
  return 0
}

function formatEta(eta: number | string | undefined): string | null {
  if (eta === undefined || eta === null) return null
  if (typeof eta === 'string') {
    // SABnzbd returns strings like "0:05:23" or "unknown"
    if (eta === 'unknown' || eta === '') return null
    return eta
  }
  if (eta < 0 || eta > 86400 * 7) return null // -1 = unknown in qbt/tr
  const h = Math.floor(eta / 3600)
  const m = Math.floor((eta % 3600) / 60)
  const s = Math.floor(eta % 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function formatBytes(bytes: number | string | undefined): string | null {
  if (bytes === undefined || bytes === null) return null
  if (typeof bytes === 'string') {
    // SABnzbd returns MB strings
    const n = parseFloat(bytes)
    if (isNaN(n)) return null
    return `${n.toFixed(0)} MB`
  }
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

const STATUS_DOT: Record<string, string> = {
  // qBittorrent
  downloading:   'bg-blue-500',
  uploading:     'bg-emerald-500',
  seeding:       'bg-emerald-500',
  stalledDL:     'bg-yellow-500',
  stalledUP:     'bg-yellow-500',
  pausedDL:      'bg-zinc-400',
  pausedUP:      'bg-zinc-400',
  checkingDL:    'bg-violet-500',
  checkingUP:    'bg-violet-500',
  error:         'bg-red-500',
  // Transmission
  stopped:       'bg-zinc-400',
  download_wait: 'bg-yellow-500',
  check_wait:    'bg-violet-500',
  checking:      'bg-violet-500',
  seed_wait:     'bg-yellow-500',
  // SABnzbd
  Downloading:   'bg-blue-500',
  Paused:        'bg-zinc-400',
  Queued:        'bg-yellow-500',
  Fetching:      'bg-violet-500',
  Completed:     'bg-emerald-500',
  Failed:        'bg-red-500',
}

function statusDot(status: string) {
  return STATUS_DOT[status] ?? 'bg-zinc-400'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

// ── Queue item row ─────────────────────────────────────────────────────────

function QueueRow({ item }: { item: DownloadQueueItem }) {
  const progress = normalizeProgress(item)
  const eta = formatEta(item.eta)
  const total = formatBytes(item.size)
  const dl = formatBytes(item.downloaded)
  const remaining = item.remaining ? `${item.remaining} MB left` : null

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-foreground line-clamp-1 flex-1">
          {item.title}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn('size-2 rounded-full', statusDot(item.status))} />
          <span className="text-xs text-muted-foreground capitalize">{item.status}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', progress >= 100 ? 'bg-emerald-500' : 'bg-blue-500')}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{progress.toFixed(1)}%</span>
        <div className="flex items-center gap-3">
          {(dl || total) && (
            <span className="flex items-center gap-1">
              <HardDrive size={10} />
              {dl && total ? `${dl} / ${total}` : (total ?? dl)}
              {remaining && ` · ${remaining}`}
            </span>
          )}
          {eta && (
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {eta}
            </span>
          )}
        </div>
      </div>

      {item.error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle size={10} />
          {item.error}
        </p>
      )}
    </div>
  )
}

// ── History row ────────────────────────────────────────────────────────────

function HistoryRow({ book }: { book: Book }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0">
      <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">
          {book.title}
          {book.series_name && (
            <span className="text-muted-foreground">
              {' '}· {book.series_name}{book.series_position ? ` #${book.series_position}` : ''}
            </span>
          )}
        </p>
      </div>
      <div className="text-right shrink-0">
        <span className={cn(
          'text-xs px-1.5 py-0.5 rounded font-medium',
          book.match_method === 'imported'
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'bg-muted text-muted-foreground',
        )}>
          {book.match_method === 'imported' ? 'Imported' : book.match_method}
        </span>
        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(book.updated_at)}</p>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function DownloadsPage() {
  const {
    data: queue = [],
    isLoading: queueLoading,
    isError: queueError,
    dataUpdatedAt,
    refetch: refetchQueue,
  } = useQuery({
    queryKey: ['downloads', 'queue'],
    queryFn: () => searchApi.queue(),
    refetchInterval: 5_000,
    staleTime: 0,
  })

  const {
    data: ownedBooks = [],
    isLoading: historyLoading,
  } = useQuery({
    queryKey: ['downloads', 'history'],
    queryFn: () => booksApi.list({ have_it: true, limit: 100 }),
    staleTime: 30_000,
  })

  // Sort owned books by updated_at desc for the history list
  const history = [...ownedBooks].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  )

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString(undefined, { timeStyle: 'short' })
    : null

  const activeItems = queue.filter((item) => {
    const p = normalizeProgress(item)
    const s = item.status?.toLowerCase() ?? ''
    return p < 100 && s !== 'completed' && s !== 'seeding' && s !== 'stopped'
  })
  const completedItems = queue.filter((item) => {
    const p = normalizeProgress(item)
    const s = item.status?.toLowerCase() ?? ''
    return p >= 100 || s === 'completed' || s === 'seeding'
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Downloads</h1>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-0.5">Updated {lastUpdated}</p>
          )}
        </div>
        <button
          onClick={() => refetchQueue()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* ── Active Queue ── */}
      <section>
        <h2 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <Download size={14} />
          Active Queue
          {activeItems.length > 0 && (
            <span className="ml-1 rounded-full bg-blue-500/15 text-blue-500 px-2 py-0.5 text-xs font-medium">
              {activeItems.length}
            </span>
          )}
        </h2>

        {queueLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
            <Loader2 size={14} className="animate-spin" />
            Loading queue…
          </div>
        )}

        {queueError && !queueLoading && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            Could not reach download client. Check the Integrations page.
          </div>
        )}

        {!queueLoading && !queueError && activeItems.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">
            No active downloads.
          </p>
        )}

        {activeItems.length > 0 && (
          <div className="flex flex-col gap-2">
            {activeItems.map((item, i) => (
              <QueueRow key={item.hash ?? item.nzo_id ?? i} item={item} />
            ))}
          </div>
        )}

        {completedItems.length > 0 && (
          <>
            <h3 className="text-xs font-medium text-muted-foreground mt-4 mb-2 uppercase tracking-wide">
              Completed / Seeding
            </h3>
            <div className="flex flex-col gap-2">
              {completedItems.map((item, i) => (
                <QueueRow key={item.hash ?? item.nzo_id ?? i} item={item} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── Download History ── */}
      <section>
        <h2 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-500" />
          Owned Books
          {history.length > 0 && (
            <span className="ml-1 text-xs text-muted-foreground">{history.length}</span>
          )}
        </h2>

        {historyLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
            <Loader2 size={14} className="animate-spin" />
            Loading history…
          </div>
        )}

        {!historyLoading && history.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">
            No owned books yet. Books are marked as owned after a scan confirms you have them.
          </p>
        )}

        {history.length > 0 && (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            {history.map((book) => (
              <HistoryRow key={book.id} book={book} />
            ))}

          </div>
        )}
      </section>
    </div>
  )
}
