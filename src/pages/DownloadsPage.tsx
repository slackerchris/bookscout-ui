import { useQuery } from '@tanstack/react-query'
import { searchApi, booksApi } from '@/lib/api'
import type { DownloadQueueItem } from '@/lib/api'
import { isAudiobookDownload, bucketStatus, statusRank } from '@/features/downloads/helpers'
import QueueRow from '@/features/downloads/QueueRow'
import ImportedRow from '@/features/downloads/ImportedRow'
import {
  Download, CheckCircle2, Clock, AlertCircle, Loader2,
  BookAudio, RefreshCw,
} from 'lucide-react'

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
    data: recentImports = [],
    isLoading: importsLoading,
  } = useQuery({
    queryKey: ['downloads', 'recently-imported'],
    queryFn: () => booksApi.recentlyImported(20),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  })

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

  const sortedQueue = [...audiobookQueue].sort((a: DownloadQueueItem, b: DownloadQueueItem) => {
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

      {/* ── Recently Imported ── */}
      <section>
        <h2 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-500" />
          Recently Imported
          {recentImports.length > 0 && (
            <span className="ml-1 text-xs text-muted-foreground">{recentImports.length}</span>
          )}
        </h2>

        {importsLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
            <Loader2 size={14} className="animate-spin" />
            Loading…
          </div>
        )}

        {!importsLoading && recentImports.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
            No books imported yet.
          </div>
        )}

        {recentImports.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {recentImports.map((book) => (
              <ImportedRow key={book.id} book={book} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
