import { useQuery } from '@tanstack/react-query'
import { searchApi, booksApi } from '@/lib/api'
import type { DownloadQueueItem } from '@/lib/api'
import type { Book } from '@/types'
import { cn } from '@/lib/utils'
import {
  Download, CheckCircle2, Clock, AlertCircle, Loader2,
  HardDrive, RefreshCw, BookAudio, Library, FolderOpen,
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

function normalizeStatus(status: string): string {
  const s = status.toLowerCase()
  if (s === 'stalleddl') return 'Stalled'
  if (s === 'stalledup' || s === 'uploading' || s === 'seeding' || s === 'seed_wait') return 'Seeding'
  if (s === 'downloading' || s === 'downloading metadata') return 'Downloading'
  if (s === 'pauseddl' || s === 'pausedup' || s === 'paused') return 'Paused'
  if (s === 'checkingdl' || s === 'checkingup' || s === 'checking' || s === 'check_wait') return 'Checking'
  if (s === 'download_wait' || s === 'queued') return 'Queued'
  if (s === 'completed') return 'Completed'
  if (s === 'stopped') return 'Stopped'
  if (s === 'failed' || s === 'error') return 'Error'
  return status
}

const AUDIOBOOK_HINTS = ['audiobook', 'audiobooks', '/audiobooks', '\\audiobooks']

function isAudiobookDownload(item: DownloadQueueItem): boolean {
  const haystacks = [item.category, item.save_path, item.title]
    .filter(Boolean)
    .map((value) => value!.toLowerCase())

  return haystacks.some((value) => AUDIOBOOK_HINTS.some((hint) => value.includes(hint)))
}

function bucketStatus(item: DownloadQueueItem): 'downloading' | 'paused' | 'completed' | 'other' {
  const progress = normalizeProgress(item)
  const s = item.status.toLowerCase()

  if (progress >= 100 || s === 'completed' || s === 'seeding') return 'completed'
  if (s === 'paused' || s === 'pauseddl' || s === 'pausedup' || s === 'stopped') return 'paused'
  if (s === 'downloading' || s === 'download_wait' || s === 'queued' || s === 'fetching') return 'downloading'
  return 'other'
}

function statusRank(item: DownloadQueueItem): number {
  const bucket = bucketStatus(item)
  if (bucket === 'downloading') return 0
  if (bucket === 'paused') return 1
  if (bucket === 'other') return 2
  return 3
}

// ── Queue item row ─────────────────────────────────────────────────────────

function QueueRow({ item }: { item: DownloadQueueItem }) {
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
}

// ── History row ────────────────────────────────────────────────────────────

function HistoryRow({ book }: { book: Book }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
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

  const audiobookQueue = queue.filter(isAudiobookDownload)
  const queueCounts = audiobookQueue.reduce(
    (acc, item) => {
      acc.total += 1
      acc[bucketStatus(item)] += 1
      return acc
    },
    { total: 0, downloading: 0, paused: 0, completed: 0, other: 0 },
  )

  const sortedQueue = [...audiobookQueue].sort((a, b) => {
    const rankDiff = statusRank(a) - statusRank(b)
    if (rankDiff !== 0) return rankDiff
    return a.title.localeCompare(b.title)
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Downloads</h1>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-0.5">Audiobook queue · updated {lastUpdated}</p>
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <BookAudio size={12} />
            Total
          </div>
          <div className="mt-2 text-2xl font-semibold text-foreground tabular-nums">{queueCounts.total}</div>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Download size={12} className="text-blue-500" />
            Downloading
          </div>
          <div className="mt-2 text-2xl font-semibold text-foreground tabular-nums">{queueCounts.downloading}</div>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Clock size={12} className="text-zinc-500" />
            Paused
          </div>
          <div className="mt-2 text-2xl font-semibold text-foreground tabular-nums">{queueCounts.paused}</div>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <CheckCircle2 size={12} className="text-emerald-500" />
            Completed
          </div>
          <div className="mt-2 text-2xl font-semibold text-foreground tabular-nums">{queueCounts.completed}</div>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Library size={12} />
            Owned books
          </div>
          <div className="mt-2 text-2xl font-semibold text-foreground tabular-nums">{history.length}</div>
        </div>
      </div>

      {/* ── Queue ── */}
      <section>
        <h2 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <Download size={14} />
          Audiobook Queue
          {audiobookQueue.length > 0 && (
            <span className="ml-1 rounded-full bg-blue-500/15 text-blue-500 px-2 py-0.5 text-xs font-medium">
              {audiobookQueue.length}
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

        {!queueLoading && !queueError && audiobookQueue.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
            No active audiobook downloads.
          </div>
        )}

        {audiobookQueue.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] border-b border-border bg-muted/30 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <span>Download</span>
              <span>Progress</span>
            </div>
            {sortedQueue.map((item, i) => (
              <QueueRow key={item.hash ?? item.nzo_id ?? i} item={item} />
            ))}
          </div>
        )}

        {!queueLoading && !queueError && queue.length > 0 && audiobookQueue.length === 0 && (
          <div className="mt-3 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
            Queue is reachable, but none of the current items look like audiobook downloads.
          </div>
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
