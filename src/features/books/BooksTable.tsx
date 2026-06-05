import { useState, Fragment, memo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ConfidenceBadge, BookStateBadge } from '@/components/StatusBadge'
import {
  Search, Trash2, ChevronLeft, ChevronRight, BookCheck, BookX,
  ExternalLink, Pencil, Calendar, Globe, TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { booksApi } from '@/lib/api/books'
import { bookKeys } from './useBooks'
import type { Book } from '@/types'
import type { BooksParams } from '@/lib/api/books'
import SearchDownloadDrawer from './SearchDownloadDrawer'
import EditBookDrawer from './EditBookDrawer'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export const PAGE_SIZE = 100

const SOURCE_LABELS: Record<string, string> = {
  openlibrary: 'OpenLibrary',
  google_books: 'Google Books',
  audnexus: 'Audnexus',
  isbndb: 'ISBNdb',
  audible: 'Audible',
}

function parseSources(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.filter(Boolean)
  } catch {
    if (raw) return [raw]
  }
  return []
}

function SourceTooltip({ source, children }: { source: string | null; children: React.ReactNode }) {
  const sources = parseSources(source)
  if (sources.length === 0) return <>{children}</>
  const label = sources.map((s) => SOURCE_LABELS[s] ?? s).join(', ')
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          Sources: {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export type BookRow = Book & { author_name: string; author_id: number }

interface Props {
  books: BookRow[]
  grouped?: boolean
  /** Total number of matching books across all pages (from the count endpoint). */
  totalCount?: number
  /** Current zero-based page index — managed by the parent. */
  page?: number
  /** Called when the user clicks prev/next. */
  onPageChange?: (page: number) => void
  /** Describe which filters are active so empty-state can explain the absence of results. */
  activeFilterSummary?: string
}

function bookState(b: BookRow): 'have_it' | 'missing' {
  return b.have_it ? 'have_it' : 'missing'
}

export function formatReleaseDate(releaseDate: string | null, publishedYear: number | null): string {
  if (releaseDate) {
    const trimmed = releaseDate.trim()
    if (/^\d{4}$/.test(trimmed)) return trimmed

    const parsed = new Date(trimmed)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: trimmed.length > 7 ? 'numeric' : undefined,
        timeZone: 'UTC',
      })
    }

    return trimmed
  }

  return publishedYear ? String(publishedYear) : '—'
}

function isFutureRelease(releaseDate: string | null): boolean {
  if (!releaseDate) return false
  const today = new Date().toISOString().slice(0, 10)
  if (/^\d{4}$/.test(releaseDate.trim())) return releaseDate.trim() > today.slice(0, 4)
  return releaseDate.trim() > today
}

function BookBadges({ book }: { book: BookRow }) {
  const badges: React.ReactNode[] = []

  if (isFutureRelease(book.release_date)) {
    badges.push(
      <span key="upcoming" className="inline-flex items-center gap-0.5 rounded-sm bg-blue-500/10 px-1 py-0.5 text-[10px] font-medium text-blue-500">
        <Calendar size={9} />Upcoming
      </span>
    )
  } else if (!book.release_date && !book.published_year) {
    badges.push(
      <span key="no-date" className="inline-flex items-center gap-0.5 rounded-sm bg-muted px-1 py-0.5 text-[10px] font-medium text-muted-foreground">
        <Calendar size={9} />No date
      </span>
    )
  }

  if (book.language && book.language !== 'en' && !book.language.startsWith('en')) {
    badges.push(
      <span key="lang" className="inline-flex items-center gap-0.5 rounded-sm bg-amber-500/10 px-1 py-0.5 text-[10px] font-medium text-amber-600">
        <Globe size={9} />{book.language.toUpperCase()}
      </span>
    )
  }

  if (book.confidence_band === 'low') {
    badges.push(
      <span key="low-conf" className="inline-flex items-center gap-0.5 rounded-sm bg-rose-500/10 px-1 py-0.5 text-[10px] font-medium text-rose-500">
        <TrendingUp size={9} />Low conf
      </span>
    )
  }

  if (!badges.length) return null
  return <div className="flex flex-wrap gap-1 mt-0.5">{badges}</div>
}

function BooksTable({ books, grouped, totalCount, page = 0, onPageChange, activeFilterSummary }: Props) {
  const [selectedBook, setSelectedBook] = useState<BookRow | null>(null)
  const [editBook, setEditBook] = useState<BookRow | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: (id: number) => booksApi.remove(id),
    onSuccess: (_, id) => {
      const authorId = books.find((b) => b.id === id)?.author_id
      queryClient.invalidateQueries({
        queryKey: bookKeys.lists(),
        predicate: (query) => {
          const params = query.queryKey[2] as BooksParams | undefined
          return authorId === undefined || params?.author_id === authorId
        },
      })
      queryClient.invalidateQueries({ queryKey: bookKeys.counts() })
      setConfirmDeleteId(null)
    },
  })

  const ownMutation = useMutation({
    mutationFn: ({ id, have_it }: { id: number; have_it: boolean }) =>
      booksApi.update(id, { have_it }),
    onSuccess: (_, { id, have_it }) => {
      queryClient.setQueriesData<Book[]>(
        { queryKey: bookKeys.lists() },
        (old) => old?.map((b) => b.id === id ? { ...b, have_it } : b),
      )
      queryClient.invalidateQueries({ queryKey: bookKeys.counts() })
    },
  })

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
        <p className="text-sm">No books match your filters.</p>
        {activeFilterSummary && (
          <p className="text-xs text-muted-foreground/70 max-w-sm text-center">{activeFilterSummary}</p>
        )}
      </div>
    )
  }

  const isServerPaged = totalCount !== undefined && onPageChange !== undefined
  const effectiveTotal = isServerPaged ? totalCount : books.length
  const totalPages = Math.ceil(effectiveTotal / PAGE_SIZE)
  const displayBooks = isServerPaged ? books : books.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const showAuthor = !grouped && displayBooks.some((b) => b.author_name)

  const groups: { author_name: string; author_id: number; books: BookRow[] }[] = []
  if (grouped) {
    for (const book of displayBooks) {
      const last = groups[groups.length - 1]
      if (last && last.author_id === book.author_id) {
        last.books.push(book)
      } else {
        groups.push({ author_name: book.author_name, author_id: book.author_id, books: [book] })
      }
    }
  }

  const renderBookRow = (book: BookRow) => (
    <TableRow key={book.id} className={cn(confirmDeleteId === book.id && 'bg-destructive/5 ring-1 ring-inset ring-destructive/20')}>
      {showAuthor && (
        <TableCell className="text-sm text-foreground align-top">
          {book.author_name}
        </TableCell>
      )}
      <TableCell className="font-medium text-foreground">
        <SourceTooltip source={book.source}>
          <div className="cursor-default w-fit">{book.title}</div>
        </SourceTooltip>
        {book.series_name && (
          <div className="text-xs text-muted-foreground mt-0.5">
            {book.series_name}
            {book.series_position ? ` · #${book.series_position}` : ''}
          </div>
        )}
        <BookBadges book={book} />
        <div className="text-xs text-muted-foreground/60 mt-0.5 font-mono">ID: {book.id}</div>
      </TableCell>
      <TableCell className="text-center align-top">
        <ConfidenceBadge band={book.confidence_band} score={book.score} reasons={book.score_reasons} />
      </TableCell>
      <TableCell className="text-sm text-muted-foreground align-top whitespace-nowrap">
        {formatReleaseDate(book.release_date, book.published_year)}
      </TableCell>
      <TableCell className="align-top">
        <BookStateBadge state={bookState(book)} />
      </TableCell>
      <TableCell className="align-top">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 w-7 p-0',
              book.have_it
                ? 'text-emerald-500 hover:text-emerald-600'
                : 'text-muted-foreground hover:text-foreground',
            )}
            title={book.have_it ? 'Mark as missing' : 'Mark as owned'}
            onClick={() => ownMutation.mutate({ id: book.id, have_it: !book.have_it })}
            disabled={ownMutation.isPending}
          >
            {book.have_it ? <BookCheck size={13} /> : <BookX size={13} />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title="Edit metadata"
            onClick={() => setEditBook(book)}
          >
            <Pencil size={13} />
          </Button>
          {book.asin && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              title="Open on Audible"
              onClick={() => window.open(`https://www.audible.com/pd/${book.asin}`, '_blank', 'noopener')}
            >
              <ExternalLink size={13} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title="Find download"
            onClick={() => setSelectedBook(book)}
          >
            <Search size={13} />
          </Button>
          {confirmDeleteId === book.id ? (
            <>
              <Button
                variant="destructive"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => deleteMutation.mutate(book.id)}
                disabled={deleteMutation.isPending}
              >
                Confirm
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              title="Dismiss (soft-delete)"
              onClick={() => setConfirmDeleteId(book.id)}
            >
              <Trash2 size={13} />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )

  return (
    <>
      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {showAuthor && <TableHead className="w-[180px]">Author</TableHead>}
              <TableHead>Title</TableHead>
              <TableHead className="w-[110px] text-center">Confidence</TableHead>
              <TableHead className="w-[120px]">Release</TableHead>
              <TableHead className="w-[90px]">Status</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grouped
              ? groups.map((group) => (
                  <Fragment key={group.author_id}>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableCell colSpan={5} className="py-1.5 text-sm font-semibold text-foreground">
                        {group.author_name}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {group.books.length} book{group.books.length !== 1 ? 's' : ''}
                        </span>
                      </TableCell>
                    </TableRow>
                    {group.books.map(renderBookRow)}
                  </Fragment>
                ))
              : displayBooks.map(renderBookRow)}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
          <span>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, effectiveTotal)} of {effectiveTotal}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={page === 0}
              onClick={() => onPageChange?.(page - 1)}
            >
              <ChevronLeft size={14} />
            </Button>
            <span>Page {page + 1} of {totalPages}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={page >= totalPages - 1}
              onClick={() => onPageChange?.(page + 1)}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      <SearchDownloadDrawer
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
      />

      <EditBookDrawer
        book={editBook}
        onClose={() => setEditBook(null)}
      />
    </>
  )
}

export default memo(BooksTable)
