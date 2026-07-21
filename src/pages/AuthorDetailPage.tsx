import { useMemo, useState } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthorDetail, useAuthorMutations, useAuthorPreferences, authorKeys } from '@/features/authors/useAuthors'
import { useFavoriteAuthors } from '@/features/authors/useFavoriteAuthors'
import CoauthorsDrawer from '@/features/authors/CoauthorsDrawer'
import ConfirmDialog from '@/components/ConfirmDialog'
import BooksFilterBar from '@/features/books/BooksFilterBar'
import { DEFAULT_BOOKS_FILTER, isNonLatinTitle, type BooksFilter } from '@/features/books/booksFilter'
import BooksTable, { type BookRow } from '@/features/books/BooksTable'
import { useBooks, bookKeys } from '@/features/books/useBooks'
import { useBookScoutSSE } from '@/lib/sse/useBookScoutSSE'
import { authorsApi } from '@/lib/api'
import { toast } from 'sonner'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import type { BookScoutEvent } from '@/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, ScanLine, Star, Users, Trash2, Loader2, AlertCircle,
  BookX, CheckCircle2, Save, ArrowUpDown, ArrowUp, ArrowDown, Zap,
} from 'lucide-react'

type SortField = 'series' | 'release_date' | 'confidence' | 'status' | 'title'
type SortDir = 'asc' | 'desc'

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

function isEnglishLanguageTag(language: string | null): boolean {
  if (!language) return false
  const normalized = language.trim().toLowerCase().replace(/_/g, '-')
  return normalized === 'en' || normalized.startsWith('en-') || normalized === 'eng' || normalized === 'english'
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

function AuthorPreferencesPanel({ authorId }: { authorId: number }) {
  const { data: preferences } = useAuthorPreferences(authorId)
  const editorKey = `${authorId}:${preferences?.notes ?? ''}:${(preferences?.ignore_rules ?? []).join('\n')}`

  return (
    <AuthorPreferencesEditor
      key={editorKey}
      authorId={authorId}
      initialNotes={preferences?.notes ?? ''}
      initialRules={preferences?.ignore_rules ?? []}
    />
  )
}

function AuthorPreferencesEditor({ authorId, initialNotes, initialRules }: {
  authorId: number
  initialNotes: string
  initialRules: string[]
}) {
  const { updatePreferences } = useAuthorMutations()
  const [notes, setNotes] = useState(initialNotes)
  const [rulesText, setRulesText] = useState(initialRules.join('\n'))

  function handleSave() {
    updatePreferences.mutate({
      id: authorId,
      patch: {
        notes,
        ignore_rules: rulesText
          .split('\n')
          .map((rule) => rule.trim())
          .filter(Boolean),
      },
    })
  }

  return (
    <section className="grid gap-3 md:grid-cols-2">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="author-notes">Notes</label>
        <textarea
          id="author-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="min-h-24 resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="author-ignore-rules">Ignore rules</label>
        <textarea
          id="author-ignore-rules"
          value={rulesText}
          onChange={(event) => setRulesText(event.target.value)}
          className="min-h-24 resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </div>
      <div className="md:col-span-2 flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={handleSave}
          disabled={updatePreferences.isPending}
        >
          {updatePreferences.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          Save notes
        </Button>
      </div>
    </section>
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

  const [filter, setFilter] = useLocalStorage<BooksFilter>('author-detail-filter', PAGE_DEFAULT)
  const [sortField, setSortField] = useLocalStorage<SortField>('author-detail-sort-field', 'series')
  const [sortDir, setSortDir] = useLocalStorage<SortDir>('author-detail-sort-dir', 'asc')
  const [page, setPage] = useState(0)
  const [scanning, setScanning] = useState(false)

  function cycleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
    setPage(0)
  }
  const [coauthorsOpen, setCoauthorsOpen] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const autoDownloadMutation = useMutation({
    mutationFn: (enabled: boolean) => authorsApi.update(authorId, { auto_download: enabled }),
    onSuccess: (_data, enabled) => {
      qc.invalidateQueries({ queryKey: authorKeys.detail(authorId) })
      toast.success(
        enabled
          ? 'Auto-download on — new high-confidence books will be grabbed after each scan'
          : 'Auto-download off',
      )
    },
    onError: (err: Error) => toast.error(`Could not update auto-download: ${err.message}`),
  })

  function handleFilterChange(next: BooksFilter) {
    setFilter((prev) => {
      if (
        prev.missing_only !== next.missing_only ||
        prev.confidence_band !== next.confidence_band ||
        prev.english_only !== next.english_only
      ) {
        setPage(0)
      }
      return next
    })
  }

  // Server-side params for this author's current filter scope.
  // English-only is applied client-side because rows without a language use the
  // same title-script heuristic as the table.
  const serverParams = {
    author_id: authorId,
    missing_only: filter.missing_only ? true : undefined,
    confidence_band: filter.confidence_band !== 'all' ? filter.confidence_band : undefined,
    limit: 500,
  }

  const { data: booksRaw = [], isLoading: booksLoading, isError: booksError } = useBooks(serverParams)

  // Attach author name (required by BookRow type) + client-side english filter + sort
  const displayBooks = useMemo<BookRow[]>(() => {  // eslint-disable-line react-hooks/exhaustive-deps
    let rows: BookRow[] = booksRaw.map((b) => ({
      ...b,
      author_id: authorId,
      author_name: author?.name ?? '',
    }))

    if (filter.english_only) {
      rows = rows.filter((b) =>
        b.language ? isEnglishLanguageTag(b.language) : !isNonLatinTitle(b.title),
      )
    }

    const dir = sortDir === 'asc' ? 1 : -1
    rows = [...rows].sort((a, b) => {
      switch (sortField) {
        case 'release_date': {
          const aDate = a.release_date ?? (a.published_year ? String(a.published_year) : '')
          const bDate = b.release_date ?? (b.published_year ? String(b.published_year) : '')
          return dir * (aDate || 'zzzz').localeCompare(bDate || 'zzzz')
        }
        case 'confidence': {
          const rank = { high: 0, medium: 1, low: 2 } as Record<string, number>
          return dir * ((rank[a.confidence_band] ?? 3) - (rank[b.confidence_band] ?? 3))
        }
        case 'status': {
          return dir * (Number(b.have_it) - Number(a.have_it))
        }
        case 'title':
          return dir * a.title.localeCompare(b.title)
        case 'series':
        default: {
          const aHasSeries = !!a.series_name
          const bHasSeries = !!b.series_name
          if (aHasSeries !== bHasSeries) return aHasSeries ? -1 : 1
          if (aHasSeries && bHasSeries) {
            const seriesCmp = a.series_name!.localeCompare(b.series_name!)
            if (seriesCmp !== 0) return dir * seriesCmp
            const aPos = parseFloat(a.series_position ?? '') || 0
            const bPos = parseFloat(b.series_position ?? '') || 0
            if (aPos !== bPos) return dir * (aPos - bPos)
          }
          return dir * a.title.localeCompare(b.title)
        }
      }
    })

    return rows
  }, [booksRaw, author?.name, authorId, filter.english_only, sortField, sortDir])

  const filteredOwnedCount = useMemo(
    () => displayBooks.reduce((count, book) => count + (book.have_it ? 1 : 0), 0),
    [displayBooks],
  )
  const filteredMissingCount = displayBooks.length - filteredOwnedCount

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

  useKeyboardShortcuts([
    { key: 's', handler: () => { if (!scanning) handleScan() } },
    { key: 'f', handler: () => handleFilterChange({ ...filter, missing_only: !filter.missing_only }) },
  ])

  function handleRemoveConfirm() {
    setConfirmRemove(false)
    remove.mutate(authorId, {
      onSuccess: () => navigate('/authors'),
    })
  }

  const isFavorite = favorites.has(authorId)

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">

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
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-7 text-xs gap-1.5',
                    author.auto_download && 'border-emerald-400/70 text-emerald-500',
                  )}
                  disabled={autoDownloadMutation.isPending}
                  onClick={() => autoDownloadMutation.mutate(!author.auto_download)}
                  title="Automatically grab new HIGH-confidence released books after each scan"
                >
                  <Zap size={12} className={cn(author.auto_download && 'fill-emerald-400/40')} />
                  {author.auto_download ? 'Auto-download on' : 'Auto-download'}
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
            <StatChip icon={CheckCircle2} label="Confirmed" value={filteredOwnedCount} className="text-emerald-500" />
            <StatChip icon={BookX} label="Missing" value={filteredMissingCount} className="text-orange-500" />
          </div>

          <AuthorPreferencesPanel authorId={authorId} />

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
            onChange={handleFilterChange}
            defaultFilter={PAGE_DEFAULT}
          />


          {!booksLoading && (
            <p className="text-sm text-muted-foreground -mt-1">
              {displayBooks.length} book{displayBooks.length !== 1 ? 's' : ''}
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

          {/* Sort bar */}
          {!booksLoading && displayBooks.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="mr-1">Sort:</span>
              {(['series', 'release_date', 'confidence', 'status', 'title'] as SortField[]).map((f) => {
                const labels: Record<SortField, string> = {
                  series: 'Series', release_date: 'Release', confidence: 'Confidence',
                  status: 'Status', title: 'Title',
                }
                const active = sortField === f
                const Icon = active ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
                return (
                  <button
                    key={f}
                    onClick={() => cycleSort(f)}
                    className={cn(
                      'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 hover:bg-muted transition-colors',
                      active && 'bg-muted text-foreground font-medium',
                    )}
                  >
                    <Icon size={10} />
                    {labels[f]}
                  </button>
                )
              })}
            </div>
          )}

          {/* Books table */}
          {!booksLoading && !booksError && (
            <BooksTable
              books={displayBooks}
              page={page}
              onPageChange={setPage}
              activeFilterSummary={
                displayBooks.length === 0
                  ? [
                      filter.missing_only && 'showing missing only',
                      filter.confidence_band !== 'all' && `confidence = ${filter.confidence_band}`,
                      filter.english_only && 'English only',
                    ].filter(Boolean).join(', ') || undefined
                  : undefined
              }
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
