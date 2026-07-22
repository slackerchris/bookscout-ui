import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { booksApi } from '@/lib/api'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight, Download, RefreshCw } from 'lucide-react'
import { seriesApi, type Series, type SeriesBook } from '@/lib/api/series'
import SearchDownloadDrawer from '@/features/books/SearchDownloadDrawer'
import type { BookRow } from '@/features/books/BooksTable'
import { cn } from '@/lib/utils'

function toBookRow(book: SeriesBook, series: Series): BookRow {
  // SearchDownloadDrawer only reads title/author fields; fill the rest with
  // safe defaults so the shared BookRow shape is satisfied.
  return {
    id: book.id,
    title: book.title,
    title_sort: book.title,
    subtitle: null,
    isbn: null,
    isbn13: null,
    asin: null,
    release_date: book.release_date,
    published_year: null,
    series_name: series.series_name,
    series_position: book.series_position,
    format: null,
    source: null,
    cover_url: book.cover_url,
    description: null,
    narrator: null,
    score: 0,
    confidence_band: book.confidence_band,
    score_reasons: null,
    language: null,
    have_it: book.have_it,
    deleted: false,
    match_method: 'api',
    primary_author_id: series.author_id,
    primary_author_manual: false,
    canonical_book_id: null,
    created_at: '',
    updated_at: '',
    author_id: series.author_id ?? 0,
    author_name: series.author_name ?? '',
  } as BookRow
}

function seriesKey(s: Series): string {
  return `${s.author_id ?? 'none'}:${s.series_name.toLowerCase()}`
}

/** True when the release date parses and is strictly in the future. */
function isUnreleased(releaseDate: string | null): boolean {
  if (!releaseDate) return false
  const iso = /^\d{4}-\d{2}-\d{2}/.exec(releaseDate)?.[0]
  const yearOnly = /^\d{4}$/.test(releaseDate.trim())
  const date = iso ? new Date(iso) : yearOnly ? new Date(`${releaseDate.trim()}-01-01`) : null
  if (!date || isNaN(date.getTime())) return false
  return date.getTime() > Date.now()
}

type SeriesSort = 'author' | 'name' | 'completion' | 'missing'

const SORT_OPTIONS: { id: SeriesSort; label: string }[] = [
  { id: 'author', label: 'Author' },
  { id: 'name', label: 'Series name' },
  { id: 'completion', label: 'Least complete' },
  { id: 'missing', label: 'Most missing' },
]

function sortSeries(list: Series[], sort: SeriesSort): Series[] {
  const sorted = [...list]
  switch (sort) {
    case 'name':
      sorted.sort((a, b) => a.series_name.localeCompare(b.series_name))
      break
    case 'completion':
      sorted.sort((a, b) => a.owned / a.total - b.owned / b.total)
      break
    case 'missing':
      sorted.sort((a, b) => (b.total - b.owned) - (a.total - a.owned))
      break
    default: // author (backend default order)
      break
  }
  return sorted
}

function PositionChips({ series }: { series: Series }) {
  const chips: Array<{ label: string; state: 'owned' | 'missing' | 'gap' }> = []
  for (const b of series.books) {
    chips.push({
      label: b.series_position || '?',
      state: b.have_it ? 'owned' : 'missing',
    })
  }
  for (const gap of series.unknown_gaps) {
    chips.push({ label: String(gap), state: 'gap' })
  }
  chips.sort((a, b) => (parseFloat(a.label) || 999) - (parseFloat(b.label) || 999))
  return (
    <div className="flex flex-wrap gap-1">
      {chips.map((c, i) => (
        <span
          key={i}
          title={c.state === 'gap' ? 'Not in catalog — metadata gap' : c.state}
          className={cn(
            'inline-flex h-5 min-w-5 items-center justify-center rounded px-1 text-[10px] font-medium',
            c.state === 'owned' && 'bg-green-500/15 text-green-600 dark:text-green-400',
            c.state === 'missing' && 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
            c.state === 'gap' && 'border border-dashed border-muted-foreground/40 text-muted-foreground',
          )}
        >
          {c.label}
        </span>
      ))}
    </div>
  )
}

function SeriesCard({
  series,
  expanded,
  onToggle,
  onSearch,
  onSearchAll,
  searchAllPending,
}: {
  series: Series
  expanded: boolean
  onToggle: () => void
  onSearch: (book: SeriesBook) => void
  onSearchAll: (books: SeriesBook[]) => void
  searchAllPending: boolean
}) {
  const pct = series.total ? Math.round((series.owned / series.total) * 100) : 0
  const missing = series.books.filter((b) => !b.have_it)
  const released = missing.filter((b) => !isUnreleased(b.release_date))
  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-3 text-left"
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown size={14} className="shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight size={14} className="shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="truncate text-sm font-medium text-foreground">{series.series_name}</span>
            {series.author_id != null && (
              <Link
                to={`/authors/${series.author_id}`}
                onClick={(e) => e.stopPropagation()}
                className="truncate text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                {series.author_name}
              </Link>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
              <div
                className={cn('h-full rounded-full', pct === 100 ? 'bg-green-500' : 'bg-primary')}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs tabular-nums text-muted-foreground">
              {series.owned}/{series.total} owned
            </span>
            {series.unknown_gaps.length > 0 && (
              <span className="text-[10px] text-muted-foreground/70">
                +{series.unknown_gaps.length} not in catalog
              </span>
            )}
          </div>
        </div>
        <PositionChips series={series} />
      </button>

      {expanded && (
        <div className="border-t border-border px-3 py-2">
          {missing.length === 0 ? (
            <p className="py-1 text-xs text-muted-foreground">Series complete 🎉</p>
          ) : (
            <>
              {released.length > 1 && (
                <div className="flex justify-end py-1.5">
                  <button
                    onClick={() => onSearchAll(released)}
                    disabled={searchAllPending}
                    title="Find the best indexer match for every released missing book and queue them under Downloads → Pending approval"
                    className="flex items-center gap-1.5 rounded-md border border-input px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
                  >
                    <Download size={11} />
                    Search all missing ({released.length})
                  </button>
                </div>
              )}
              <ul className="divide-y divide-border/60">
                {missing.map((b) => {
                  const upcoming = isUnreleased(b.release_date)
                  return (
                    <li key={b.id} className="flex items-center gap-2 py-1.5">
                      <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                        {b.series_position || '—'}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{b.title}</span>
                      {b.release_date && (
                        <span className="shrink-0 text-xs text-muted-foreground">{b.release_date}</span>
                      )}
                      {upcoming ? (
                        <span className="shrink-0 rounded-md bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-500">
                          Upcoming
                        </span>
                      ) : (
                        <button
                          onClick={() => onSearch(b)}
                          className="flex shrink-0 items-center gap-1 rounded-md border border-input px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          <Download size={11} />
                          Search
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function SeriesPage() {
  const [missingOnly, setMissingOnly] = useLocalStorage('series-missing-only', true)
  const [sort, setSort] = useLocalStorage<SeriesSort>('series-sort', 'author')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [searchTarget, setSearchTarget] = useState<BookRow | null>(null)

  const requestAll = useMutation({
    mutationFn: (bookIds: number[]) => booksApi.requestDownloads(bookIds),
    onSuccess: (res) =>
      toast.success(`Searching for ${res.requested} books`, {
        description: 'Best matches will appear under Downloads → Pending approval.',
        duration: 6000,
      }),
    onError: (err: Error) => toast.error(`Request failed: ${err.message}`),
  })

  const { data: rawSeries = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['series', missingOnly],
    queryFn: () => seriesApi.list({ missing_only: missingOnly }),
    staleTime: 60_000,
  })
  const series = useMemo(() => sortSeries(rawSeries, sort), [rawSeries, sort])

  const stats = useMemo(() => {
    const incomplete = series.filter((s) => s.owned < s.total)
    const missingBooks = series.reduce((n, s) => n + (s.total - s.owned), 0)
    return { total: series.length, incomplete: incomplete.length, missingBooks }
  }, [series])

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Series</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isLoading
              ? 'Loading…'
              : `${stats.total} series · ${stats.incomplete} incomplete · ${stats.missingBooks} missing books`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SeriesSort)}
            aria-label="Sort series"
            className="h-7 rounded-md border border-input bg-transparent px-2 text-xs text-muted-foreground outline-none focus-visible:border-ring"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>Sort: {o.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={missingOnly}
              onChange={(e) => setMissingOnly(e.target.checked)}
              className="accent-primary"
            />
            Incomplete only
          </label>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      </div>

      {isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          Failed to load series — is the BookScout API reachable?
        </div>
      ) : isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Loading series…</div>
      ) : series.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          {missingOnly
            ? 'No incomplete series — everything you track is fully owned. 🎉'
            : 'No series found. Series info appears after your first scans.'}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {series.map((s) => (
            <SeriesCard
              key={seriesKey(s)}
              series={s}
              expanded={expanded.has(seriesKey(s))}
              onToggle={() => toggle(seriesKey(s))}
              onSearch={(b) => setSearchTarget(toBookRow(b, s))}
              onSearchAll={(books) => requestAll.mutate(books.map((b) => b.id))}
              searchAllPending={requestAll.isPending}
            />
          ))}
        </div>
      )}

      <SearchDownloadDrawer book={searchTarget} onClose={() => setSearchTarget(null)} />
    </div>
  )
}
