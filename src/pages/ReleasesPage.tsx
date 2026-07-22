import { useMemo, type ElementType } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  Clock3,
  Loader2,
  AlertCircle,
  BookX,
  Zap,
  HelpCircle,
} from 'lucide-react'
import {
  useBookSummary,
  useRecentlyDiscoveredBooks,
  useUpcomingBooks,
} from '@/features/books/useBooks'
import type { BookWithAuthor, ConfidenceBand } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

type ReleaseTab = 'upcoming' | 'recent'
type ConfidenceFilter = 'all' | ConfidenceBand

function formatReleaseDate(value: string | null) {
  if (!value) return 'No date'
  if (/^\d{4}$/.test(value)) return value
  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function monthKey(value: string | null) {
  if (!value) return 'No date'
  if (/^\d{4}$/.test(value)) return value
  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

function formatDiscoveredDate(value: string) {
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function confidenceClass(band: string) {
  if (band === 'high') return 'bg-emerald-500/15 text-emerald-500'
  if (band === 'medium') return 'bg-amber-500/15 text-amber-500'
  return 'bg-muted text-muted-foreground'
}

function StatTile({ label, value, icon: Icon, iconClassName }: {
  label: string
  value: number | undefined
  icon: ElementType
  iconClassName?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
        <Icon size={13} className={iconClassName} />
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value ?? '—'}</div>
    </div>
  )
}

function ReleaseRow({ book, mode }: { book: BookWithAuthor; mode: ReleaseTab }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-border px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1fr)_10rem_7rem]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">{book.title}</p>
          <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', confidenceClass(book.confidence_band))}>
            {book.confidence_band}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <Link className="hover:text-foreground" to={`/authors/${book.author_id}`}>
            {book.author_name}
          </Link>
          {book.series_name && <span>{book.series_name}{book.series_position ? ` · #${book.series_position}` : ''}</span>}
        </div>
      </div>

      <div className="text-right text-sm text-muted-foreground md:text-left">
        {mode === 'upcoming' ? formatReleaseDate(book.release_date) : formatDiscoveredDate(book.created_at)}
      </div>

      <div className="hidden items-center justify-end md:flex">
        <span className={cn(
          'rounded-full px-2 py-0.5 text-xs font-medium',
          book.have_it ? 'bg-emerald-500/15 text-emerald-500' : 'bg-orange-500/15 text-orange-500',
        )}>
          {book.have_it ? 'Owned' : 'Missing'}
        </span>
      </div>
    </div>
  )
}

export default function ReleasesPage() {
  const [tab, setTab] = useLocalStorage<ReleaseTab>('releases-tab', 'upcoming')
  const [missingOnly, setMissingOnly] = useLocalStorage('releases-missing-only', true)
  const [confidence, setConfidence] = useLocalStorage<ConfidenceFilter>('releases-confidence', 'all')

  const { data: summary, isLoading: summaryLoading } = useBookSummary()
  const upcomingParams = {
    limit: 200,
    missing_only: missingOnly,
    confidence_band: confidence === 'all' ? undefined : confidence,
  }
  const recentParams = { limit: 100, missing_only: missingOnly }

  const {
    data: upcoming = [],
    isLoading: upcomingLoading,
    isError: upcomingError,
  } = useUpcomingBooks(upcomingParams)
  const {
    data: recent = [],
    isLoading: recentLoading,
    isError: recentError,
  } = useRecentlyDiscoveredBooks(recentParams)

  const recentFiltered = useMemo(() => {
    if (confidence === 'all') return recent
    return recent.filter((book) => book.confidence_band === confidence)
  }, [recent, confidence])

  const groupedUpcoming = useMemo(() => {
    return upcoming.reduce<Record<string, BookWithAuthor[]>>((groups, book) => {
      const key = monthKey(book.release_date)
      groups[key] = groups[key] ?? []
      groups[key].push(book)
      return groups
    }, {})
  }, [upcoming])

  const activeRows = tab === 'upcoming' ? upcoming : recentFiltered
  const activeLoading = tab === 'upcoming' ? upcomingLoading : recentLoading
  const activeError = tab === 'upcoming' ? upcomingError : recentError

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Releases</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Upcoming audiobooks and newly discovered catalog rows</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Missing" value={summary?.missing} icon={BookX} iconClassName="text-orange-500" />
        <StatTile label="High confidence" value={summary?.high_confidence_missing} icon={Zap} iconClassName="text-amber-500" />
        <StatTile label="Upcoming" value={summary?.upcoming_missing} icon={CalendarDays} iconClassName="text-cyan-500" />
        <StatTile label="No date" value={summary?.no_release_date} icon={HelpCircle} iconClassName="text-muted-foreground" />
      </div>

      {summaryLoading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 size={12} className="animate-spin" />
          Updating release counts…
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Release list view" className="flex items-center gap-2">
          <Button
            role="tab"
            aria-selected={tab === 'upcoming'}
            variant={tab === 'upcoming' ? 'default' : 'outline'}
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setTab('upcoming')}
          >
            <CalendarDays size={12} />
            Upcoming
          </Button>
          <Button
            role="tab"
            aria-selected={tab === 'recent'}
            variant={tab === 'recent' ? 'default' : 'outline'}
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setTab('recent')}
          >
            <Clock3 size={12} />
            Recently found
          </Button>
        </div>

        <label className="flex h-8 items-center gap-2 rounded-md border border-border px-3 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={missingOnly}
            onChange={(e) => setMissingOnly(e.target.checked)}
          />
          Missing only
        </label>

        <Select value={confidence} onValueChange={(value) => setConfidence(value as ConfidenceFilter)}>
          <SelectTrigger size="sm" className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All confidence</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {activeError && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle size={14} className="shrink-0" />
          Failed to load releases.
        </div>
      )}

      {activeLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          Loading…
        </div>
      )}

      {!activeLoading && !activeError && activeRows.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
          No releases match the current filters.
        </div>
      )}

      {!activeLoading && !activeError && tab === 'upcoming' && activeRows.length > 0 && (
        <div className="flex flex-col gap-4">
          {Object.entries(groupedUpcoming).map(([group, books]) => (
            <section key={group}>
              <h2 className="mb-2 text-xs font-medium uppercase text-muted-foreground">{group}</h2>
              <div className="overflow-hidden rounded-lg border border-border bg-card">
                {books.map((book) => <ReleaseRow key={book.id} book={book} mode="upcoming" />)}
              </div>
            </section>
          ))}
        </div>
      )}

      {!activeLoading && !activeError && tab === 'recent' && activeRows.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {recentFiltered.map((book) => <ReleaseRow key={book.id} book={book} mode="recent" />)}
        </div>
      )}
    </div>
  )
}
