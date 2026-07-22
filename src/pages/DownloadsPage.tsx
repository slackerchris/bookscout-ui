import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { searchApi, booksApi } from '@/lib/api'
import type { DownloadQueueItem } from '@/lib/api'
import type { DownloadHistoryItem } from '@/lib/api/books'
import { isAudiobookDownload, bucketStatus, statusRank } from '@/features/downloads/helpers'
import QueueRow from '@/features/downloads/QueueRow'
import ImportedRow from '@/features/downloads/ImportedRow'
import {
  Download, CheckCircle2, Clock, AlertCircle, Loader2,
  BookAudio, RefreshCw, History, Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type Tab = 'queue' | 'pending' | 'history' | 'imported'

function humanizeBytes(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}

function formatRelTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function HistoryTable({ items, onClear, onRetry, retryPending }: { items: DownloadHistoryItem[]; onClear: () => void; onRetry: (id: number) => void; retryPending: boolean }) {
  const [confirm, setConfirm] = useState(false)

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
        No download history yet.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-[minmax(0,1fr)_80px_80px_72px_80px_64px] gap-2 border-b border-border bg-muted/30 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <span>Release</span>
          <span>Type</span>
          <span>Size</span>
          <span>Status</span>
          <span>When</span>
          <span></span>
        </div>
        {items.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[minmax(0,1fr)_80px_80px_72px_80px_64px] gap-2 items-center border-b border-border last:border-0 px-4 py-2.5 text-sm"
          >
            <div>
              <p className="font-medium text-foreground truncate">{item.release_title}</p>
              {item.book_title && (
                <p className="text-xs text-muted-foreground truncate">
                  {item.book_title}
                  {item.indexer ? ` · ${item.indexer}` : ''}
                </p>
              )}
            </div>
            <span className={`text-xs font-semibold ${item.type === 'nzb' ? 'text-amber-500' : 'text-sky-500'}`}>
              {item.type?.toUpperCase() ?? '—'}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {humanizeBytes(item.size_bytes)}
            </span>
            <span className={cn(
              'inline-flex items-center gap-1 text-xs font-medium',
              item.status === 'queued' && 'text-emerald-500',
              item.status === 'pending' && 'text-amber-500',
              item.status === 'dismissed' && 'text-muted-foreground',
              item.status === 'failed' && 'text-destructive',
            )}>
              {item.status === 'queued' && <><CheckCircle2 size={11} />Queued</>}
              {item.status === 'pending' && <><Clock size={11} />Pending</>}
              {item.status === 'dismissed' && <>Dismissed</>}
              {item.status === 'failed' && <><AlertCircle size={11} />Failed</>}
            </span>
            <span className="text-xs text-muted-foreground">{formatRelTime(item.created_at)}</span>
            <span>
              {item.status === 'failed' && item.download_url && (
                <button
                  onClick={() => onRetry(item.id)}
                  disabled={retryPending}
                  title="Send this release to the download client again"
                  className="rounded-md border border-input px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
                >
                  Retry
                </button>
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        {confirm ? (
          <div className="flex gap-2">
            <button
              className="text-xs text-destructive hover:underline"
              onClick={onClear}
            >
              Yes, clear all
            </button>
            <button
              className="text-xs text-muted-foreground hover:underline"
              onClick={() => setConfirm(false)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="flex items-center gap-1 text-xs text-muted-foreground/70 hover:text-muted-foreground"
            onClick={() => setConfirm(true)}
          >
            <Trash2 size={11} />
            Clear history
          </button>
        )}
      </div>
    </div>
  )
}

export default function DownloadsPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('queue')

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

  const {
    data: history = [],
    isLoading: historyLoading,
  } = useQuery({
    queryKey: ['download-history'],
    queryFn: () => booksApi.downloadHistory(200),
    staleTime: 30_000,
  })

  const {
    data: pending = [],
    isLoading: pendingLoading,
    isError: pendingError,
  } = useQuery({
    queryKey: ['download-history', 'pending'],
    queryFn: () => booksApi.downloadHistory(100, 'pending'),
    staleTime: 15_000,
    refetchInterval: 60_000,
  })

  const approveMutation = useMutation({
    mutationFn: (id: number) => booksApi.approveDownload(id),
    onSuccess: (attempt) => {
      qc.invalidateQueries({ queryKey: ['download-history'] })
      qc.invalidateQueries({ queryKey: ['downloads', 'queue'] })
      toast.success(`Sent to download client: ${attempt.release_title}`)
    },
    onError: (err: Error) => toast.error(`Approve failed: ${err.message}`),
  })

  const dismissMutation = useMutation({
    mutationFn: (id: number) => booksApi.dismissDownload(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['download-history'] }),
    onError: (err: Error) => toast.error(`Dismiss failed: ${err.message}`),
  })

  const clearHistoryMutation = useMutation({
    mutationFn: () => booksApi.clearDownloadHistory(),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['download-history'] })
      toast.success(`Cleared ${data.deleted} entries`)
    },
    onError: () => toast.error('Failed to clear history'),
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

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'queue', label: 'Queue', count: audiobookQueue.length || undefined },
    { id: 'pending', label: 'Pending approval', count: pending.length || undefined },
    { id: 'history', label: 'History', count: history.length || undefined },
    { id: 'imported', label: 'Imported', count: recentImports.length || undefined },
  ]

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Downloads</h1>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-0.5">Queue updated {lastUpdated}</p>
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

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Total', icon: BookAudio, value: queueCounts.total },
          { label: 'Downloading', icon: Download, value: queueCounts.downloading, color: 'text-blue-500' },
          { label: 'Paused', icon: Clock, value: queueCounts.paused, color: 'text-zinc-500' },
          { label: 'Completed', icon: CheckCircle2, value: queueCounts.completed, color: 'text-emerald-500' },
          { label: 'History', icon: History, value: history.length, color: 'text-muted-foreground' },
        ].map(({ label, icon: Icon, value, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Icon size={12} className={color} />
              {label}
            </div>
            <div className="mt-2 text-2xl font-semibold text-foreground tabular-nums">{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 -mb-px transition-colors',
              tab === t.id
                ? 'border-foreground text-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'queue' && (
        <section>
          {queueLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
              <Loader2 size={14} className="animate-spin" />Loading queue…
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
      )}

      {tab === 'pending' && (
        <section>
          {pendingLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
              <Loader2 size={14} className="animate-spin" />Loading…
            </div>
          )}
          {pendingError && !pendingLoading && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              Could not load pending downloads.
            </div>
          )}
          {!pendingLoading && !pendingError && pending.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
              Nothing awaiting approval. Auto-download finds go here when the mode is
              &ldquo;approval&rdquo; (Settings → Download preferences).
            </div>
          )}
          {pending.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              {pending.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{item.release_title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {item.book_title ?? 'Unknown book'}
                      {item.indexer ? ` · ${item.indexer}` : ''}
                      {item.seeders != null ? ` · ${item.seeders} seeders` : ''}
                      {` · ${humanizeBytes(item.size_bytes)}`}
                      {` · ${formatRelTime(item.created_at)}`}
                    </p>
                  </div>
                  <button
                    onClick={() => dismissMutation.mutate(item.id)}
                    disabled={dismissMutation.isPending}
                    className="shrink-0 rounded-md border border-input px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => approveMutation.mutate(item.id)}
                    disabled={approveMutation.isPending}
                    className="flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Download size={12} />
                    Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'history' && (
        <section>
          {historyLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
              <Loader2 size={14} className="animate-spin" />Loading…
            </div>
          ) : (
            <HistoryTable
              items={history}
              onClear={() => clearHistoryMutation.mutate()}
              onRetry={(id) => approveMutation.mutate(id)}
              retryPending={approveMutation.isPending}
            />
          )}
        </section>
      )}

      {tab === 'imported' && (
        <section>
          {importsLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
              <Loader2 size={14} className="animate-spin" />Loading…
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
      )}
    </div>
  )
}
