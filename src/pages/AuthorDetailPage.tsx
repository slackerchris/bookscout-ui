import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthorDetail, useAuthorMutations, authorKeys } from '@/features/authors/useAuthors'
import { useFavoriteAuthors } from '@/features/authors/useFavoriteAuthors'
import CoauthorsDrawer from '@/features/authors/CoauthorsDrawer'
import ConfirmDialog from '@/components/ConfirmDialog'
import BooksFilterBar, { type BooksFilter, DEFAULT_BOOKS_FILTER, isNonLatinTitle } from '@/features/books/BooksFilterBar'
import BooksTable, { type BookRow, PAGE_SIZE } from '@/features/books/BooksTable'
import { useBooks, useBooksCount, bookKeys } from '@/features/books/useBooks'
import { useBookScoutSSE } from '@/lib/sse/useBookScoutSSE'
import type { BookScoutEvent } from '@/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, ScanLine, Star, Users, Trash2, Loader2, AlertCircle,
  BookX, CheckCircle2,
} from 'lucide-react'

// ── Avatar (same logic as AuthorsPage) ────────────────────────────────────

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-orange-500',
  'bg-rose-500',  'bg-teal-500',  'bg-pink-500',    'bg-indigo-500',
  'bg-amber-500', 'bg-cyan-500',
]

function avatarColor(name: string): string {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').slice(0, 2).join('').toUpperCase()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

// ── Stat chip ──────────────────────────────────────────────────────────────

function StatChip({ icon: Icon, label, value, className }: {
  icon: React.ElementType
  label: string
  value: number | undefined
  className?: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
      <Icon size={14} className={cn('shrink-0', className)} />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold tabular-nums text-foreground leading-tight">
          {value ?? '—'}
        </p>
      </div>
    </div>
  )
}

// ── Page default filter ────────────────────────────────────────────────────

const PAGE_DEFAULT: BooksFilter = {
  ...DEFAULT_BOOKS_FILTER,
  missing_only: false,
  english_only: true,
  confidence_band: 'all',
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function AuthorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const authorId = Number(id)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: author, isLoading, isError } = useAuthorDetail(authorId)
  const { remove, scan } = useAuthorMutations()
  const { favorites, toggle: toggleFavorite } = useFavoriteAuthors()

  const [filter, setFilter] = useState<BooksFilter>(PAGE_DEFAULT)
  const [page, setPage] = useState(0)
  const [scanning, setScanning] = useState(false)
  const [coauthorsOpen, setCoauthorsOpen] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  // Reset to first page when server-side filter params change.
  // english_only is intentionally excluded — it's client-side only and doesn't
  // affect the paginated query, so changing it shouldn't reset pagination.
  useEffect(() => {
    setPage(0)
  }, [filter.missing_only, filter.confidence_band])

  // Server-side params — paginated
  const serverParams = {
    author_id: authorId,
    missing_only: filter.missing_only ? true : undefined,
    confidence_band: filter.confidence_band !== 'all' ? filter.confidence_band : undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  }

  // Count params — no limit/offset, same filters
  const countParams = {
    author_id: authorId,
    missing_only: filter.missing_only ? true : undefined,
    confidence_band: filter.confidence_band !== 'all' ? filter.confidence_band : undefined,
  }

  const { data: booksRaw = [], isLoading: booksLoading, isError: booksError } = useBooks(serverParams)
  const { data: totalCount = 0, isLoading: countLoading } = useBooksCount(countParams)

  // Attach author name (required by BookRow type) + client-side english filter + sort
  const displayBooks = useMemo<BookRow[]>(() => {
    let rows: BookRow[] = booksRaw.map((b) => ({
      ...b,
      author_id: authorId,
      author_name: author?.name ?? '',
    }))

    if (filter.english_only) {
      rows = rows.filter((b) =>
        b.language ? b.language === 'en' : !isNonLatinTitle(b.title),
      )
    }

    // Sort: series first (standalones last) → series name → position → title
    rows = [...rows].sort((a, b) => {
      const aHasSeries = !!a.series_name
      const bHasSeries = !!b.series_name
      if (aHasSeries !== bHasSeries) return aHasSeries ? -1 : 1
      if (aHasSeries && bHasSeries) {
        const seriesCmp = a.series_name!.localeCompare(b.series_name!)
        if (seriesCmp !== 0) return seriesCmp
        const aPos = parseFloat(a.series_position ?? '') || 0
        const bPos = parseFloat(b.series_position ?? '') || 0
        if (aPos !== bPos) return aPos - bPos
      }
      return a.title.localeCompare(b.title)
    })

    return rows
  }, [booksRaw, author?.name, authorId, filter.english_only])

  // Live: refresh books when a scan completes for this author
  useBookScoutSSE((event: BookScoutEvent) => {
    if (event.event_type === 'scan.complete') {
      const payload = event.payload
      if (!payload.author_id || payload.author_id === authorId) {
        setScanning(false)
        qc.invalidateQueries({ queryKey: bookKeys.counts() })
        qc.invalidateQueries({ queryKey: bookKeys.list(serverParams) })
        qc.invalidateQueries({ queryKey: authorKeys.detail(authorId) })
      }
    }
  })

  function handleScan() {
    scan.reset() // clear any previous error banner before the new attempt
    setScanning(true)
    // Don't reset on settle — scanning stays true until scan.complete SSE fires.
    // Fallback: clear after 10 min in case SSE is unavailable.
    scan.mutate(authorId, {
      onError: () => setScanning(false),
    })
    setTimeout(() => setScanning(false), 10 * 60 * 1000)
  }

  function handleRemoveConfirm() {
    setConfirmRemove(false)
    remove.mutate(authorId, {
      onSuccess: () => navigate('/authors'),
    })
  }

  const isFavorite = favorites.has(authorId)
  const missing = author ? author.book_count - author.owned_count : undefined

  return (
    <div className="flex flex-col gap-4 p-6">

      {/* Back nav */}
      <Button variant="ghost" size="sm" className="w-fit -ml-2 gap-1.5 text-muted-foreground" onClick={() => navigate('/authors')}>
        <ArrowLeft size={13} />
        All authors
      </Button>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          Failed to load author. Is BookScout running?
        </div>
      )}

      {author && (
        <>
          {/* Author header */}
          <div className="flex items-start gap-4 flex-wrap">
            <div className={cn(
              'flex size-16 shrink-0 items-center justify-center rounded-full text-white text-xl font-semibold select-none',
              avatarColor(author.name),
            )}>
              {initials(author.name)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold text-foreground">{author.name}</h1>
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  author.active
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-muted text-muted-foreground',
                )}>
                  {author.active ? 'Watching' : 'Inactive'}
                </span>
              </div>
              {author.last_scanned && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Last scanned {formatDate(author.last_scanned)}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Button size="sm" className="h-7 text-xs gap-1.5" disabled={scanning} onClick={handleScan}>
                  {scanning ? <Loader2 size={12} className="animate-spin" /> : <ScanLine size={12} />}
                  Scan now
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn('h-7 text-xs gap-1.5', isFavorite && 'border-amber-400/70 text-amber-500')}
                  onClick={() => toggleFavorite(authorId)}
                >
                  <Star size={12} className={cn(isFavorite && 'fill-amber-400')} />
                  {isFavorite ? 'Favorited' : 'Favorite'}
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => setCoauthorsOpen(true)}>
                  <Users size={12} />
                  Coauthors
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmRemove(true)}
                >
                  <Trash2 size={12} />
                  Remove
                </Button>
              </div>
            </div>
          </div>

          {/* Stat chips */}
          <div className="flex gap-3 flex-wrap">
            <StatChip icon={CheckCircle2} label="Confirmed" value={author.owned_count} className="text-emerald-500" />
            <StatChip icon={BookX} label="Missing" value={missing} className="text-orange-500" />
          </div>

          {/* Scan error */}
          {scan.isError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              Scan failed: {scan.error instanceof Error ? scan.error.message : 'Unknown error'}
            </div>
          )}

          {/* Filter bar — no author picker since we're scoped to one */}
          <BooksFilterBar
            filter={filter}
            onChange={setFilter}
            defaultFilter={PAGE_DEFAULT}
          />

          {/* Book count — suppressed until both the list and count queries resolve to avoid "0 books" flicker */}
          {!booksLoading && !countLoading && (
            <p className="text-sm text-muted-foreground -mt-1">
              {totalCount} book{totalCount !== 1 ? 's' : ''}
            </p>
          )}

          {/* Books loading */}
          {booksLoading && (
            <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Loading books…</span>
            </div>
          )}

          {/* Books error */}
          {booksError && !booksLoading && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Failed to load books.
            </div>
          )}

          {/* Books table */}
          {!booksLoading && !booksError && (
            <BooksTable
              books={displayBooks}
              totalCount={totalCount}
              page={page}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {/* Drawers / dialogs */}
      <CoauthorsDrawer
        authorId={coauthorsOpen ? authorId : null}
        authorName={author?.name ?? null}
        onClose={() => setCoauthorsOpen(false)}
      />

      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={(open) => { if (!open) setConfirmRemove(false) }}
        title="Remove author"
        description={`Remove "${author?.name}" and all their tracked books? This cannot be undone.`}
        confirmLabel="Remove"
        onConfirm={handleRemoveConfirm}
        isPending={remove.isPending}
      />
    </div>
  )
}
