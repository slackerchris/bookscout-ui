import { useState, useMemo } from 'react'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import { useAuthors } from '@/features/authors/useAuthors'
import { bookKeys } from '@/features/books/useBooks'
import BooksFilterBar, { type BooksFilter, DEFAULT_BOOKS_FILTER, isNonLatinTitle } from '@/features/books/BooksFilterBar'
import BooksTable, { type BookRow } from '@/features/books/BooksTable'
import { booksApi } from '@/lib/api/books'
import { useBookScoutSSE } from '@/lib/sse/useBookScoutSSE'
import type { BookScoutEvent } from '@/types'
import { Loader2 } from 'lucide-react'

const PAGE_DEFAULT: BooksFilter = { ...DEFAULT_BOOKS_FILTER, missing_only: true, english_only: true }

export default function MissingBooksPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<BooksFilter>(PAGE_DEFAULT)

  // 1. Fetch all authors
  const { data: authors, isLoading: authorsLoading, isError: authorsError } = useAuthors()

  // 2. Fetch books per-author in parallel (author info isn't returned by /books/)
  const bookQueries = useQueries({
    queries: (authors ?? []).map((author) => ({
      queryKey: bookKeys.list({ author_id: author.id, missing_only: filter.missing_only }),
      queryFn: () =>
        booksApi.list({ author_id: author.id, missing_only: filter.missing_only || undefined }),
    })),
  })

  // 3. Flatten results and attach author info to each book
  const bookRows = useMemo<BookRow[]>(() => {
    if (!authors) return []
    return authors.flatMap((author, i) =>
      (bookQueries[i]?.data ?? []).map((book) => ({
        ...book,
        author_id: author.id,
        author_name: author.name,
      })),
    )
  }, [authors, bookQueries])

  // 4. Apply client-side filters (confidence band, author, english_only)
  const displayBooks = useMemo(() => {
    let rows = bookRows
    if (filter.confidence_band !== 'all') {
      rows = rows.filter((b) => b.confidence_band === filter.confidence_band)
    }
    if (filter.author_id !== 'all') {
      rows = rows.filter((b) => b.author_id === filter.author_id)
    }
    if (filter.english_only) {
      rows = rows.filter((b) => !isNonLatinTitle(b.title))
    }
    return rows
  }, [bookRows, filter.confidence_band, filter.author_id, filter.english_only])

  const isLoading = authorsLoading || bookQueries.some((q) => q.isLoading)
  const isError = !isLoading && (authorsError || bookQueries.some((q) => q.isError))

  // Live updates: invalidate books list when a scan completes
  useBookScoutSSE((event: BookScoutEvent) => {
    if (event.event_type === 'scan.complete') {
      qc.invalidateQueries({ queryKey: bookKeys.all })
    }
  })

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Missing Books</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {displayBooks.length} book{displayBooks.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      <BooksFilterBar
        filter={filter}
        onChange={setFilter}
        defaultFilter={PAGE_DEFAULT}
        authors={authors}
      />

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      )}

      {isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load books. Is BookScout running?
        </div>
      )}

      {!isLoading && !isError && <BooksTable books={displayBooks} />}
    </div>
  )
}
