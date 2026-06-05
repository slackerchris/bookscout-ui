import { useState, useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Download, Loader2, CheckCircle2, AlertCircle, Star } from 'lucide-react'
import { searchApi, type SearchResult } from '@/lib/api/search'
import { cn } from '@/lib/utils'
import type { BookRow } from './BooksTable'

interface Props {
  book: BookRow | null
  onClose: () => void
}

type DlState = 'idle' | 'loading' | 'success' | 'error'

function dlKey(r: SearchResult): string {
  return r.download_url || r.magnet_url || r.title
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function scoreResult(result: SearchResult, book: BookRow): number {
  let score = 0
  const t = result.title.toLowerCase()
  const bookTitle = book.title.toLowerCase()
  const authorName = (book.author_name ?? '').toLowerCase()

  // Title contains book title words
  const titleWords = bookTitle.split(/\s+/).filter((w) => w.length > 3)
  const matchedWords = titleWords.filter((w) => t.includes(w))
  score += (matchedWords.length / Math.max(titleWords.length, 1)) * 30

  // Author name present
  if (authorName && authorName.split(' ').some((w) => w.length > 2 && t.includes(w))) {
    score += 15
  }

  // Year match
  const year = book.release_date?.slice(0, 4) ?? book.published_year?.toString()
  if (year && t.includes(year)) score += 10

  // Unabridged bonus
  if (t.includes('unabridged')) score += 10

  // Narrator
  if (book.narrator) {
    const nParts = book.narrator.toLowerCase().split(/[\s,]+/).filter((w) => w.length > 2)
    if (nParts.some((n) => t.includes(n))) score += 10
  }

  // Audio format bonus
  if (/\bm4b\b/.test(t)) score += 8
  if (/\bmp3\b/.test(t)) score += 3

  // Seeder signal (log-scale, cap contribution)
  const seeders = result.seeders ?? 0
  if (seeders > 0) score += Math.min(Math.log10(seeders + 1) * 5, 10)

  // Penalise very small (<5 MB) or very large (>8 GB) files
  const bytes = result.size ?? 0
  if (bytes > 0) {
    const gb = bytes / 1_073_741_824
    if (gb > 8) score -= 15
    if (bytes < 5_000_000) score -= 20
  }

  return Math.round(score)
}

export default function SearchDownloadDrawer({ book, onClose }: Props) {
  return (
    <Sheet open={!!book} onOpenChange={(open) => { if (!open) onClose() }}>
      {book && <SearchDownloadContent key={book.id} book={book} />}
    </Sheet>
  )
}

function SearchDownloadContent({ book }: { book: BookRow }) {
  const initialQuery = book.author_name ? `${book.title} ${book.author_name}` : book.title
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [dlStates, setDlStates] = useState<Record<string, DlState>>({})
  const [showScores, setShowScores] = useState(false)

  const searchMutation = useMutation({
    mutationFn: (q: string) => searchApi.search(q),
    onSuccess: (data) => setResults(data),
  })

  const mutateRef = useRef(searchMutation.mutate)
  const resetRef = useRef(searchMutation.reset)

  useEffect(() => {
    mutateRef.current = searchMutation.mutate
    resetRef.current = searchMutation.reset
  }, [searchMutation.mutate, searchMutation.reset])

  useEffect(() => {
    resetRef.current()
    mutateRef.current(initialQuery)
  }, [initialQuery])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) {
      setResults([])
      setDlStates({})
      searchMutation.mutate(q)
    }
  }

  async function handleDownload(r: SearchResult) {
    const key = dlKey(r)
    const url = r.download_url || r.magnet_url
    if (!url) return
    setDlStates((s) => ({ ...s, [key]: 'loading' }))
    try {
      await searchApi.download({
        url,
        title: r.title,
        type: r.type.toLowerCase() === 'nzb' ? 'nzb' : 'torrent',
        book_id: book.id,
      })
      setDlStates((s) => ({ ...s, [key]: 'success' }))
    } catch {
      setDlStates((s) => ({ ...s, [key]: 'error' }))
    }
  }

  // Score all results and find the top one
  const scored = results.map((r) => ({ result: r, score: scoreResult(r, book) }))
  scored.sort((a, b) => b.score - a.score)
  const topScore = scored[0]?.score ?? 0
  const topKey = scored[0] ? dlKey(scored[0].result) : null

  return (
    <>
      <SheetContent className="flex flex-col w-[680px] sm:max-w-[680px] gap-0 p-0">
        <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Search size={15} />
            Find Download
          </SheetTitle>
          <p className="text-sm text-muted-foreground truncate">
            {book.title}
            {book.author_name ? ` · ${book.author_name}` : ''}
          </p>
        </SheetHeader>

        <form onSubmit={handleSearch} className="flex gap-2 px-6 py-3 border-b border-border shrink-0">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title…"
            className="h-8 text-sm"
          />
          <Button type="submit" size="sm" disabled={searchMutation.isPending || !query.trim()}>
            {searchMutation.isPending
              ? <Loader2 size={13} className="animate-spin" />
              : <Search size={13} />}
            Search
          </Button>
          {results.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={() => setShowScores((s) => !s)}
              title="Toggle score column"
            >
              <Star size={13} />
            </Button>
          )}
        </form>

        <div className="flex-1 overflow-y-auto min-h-0">
          {searchMutation.isPending && (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Searching indexers…</span>
            </div>
          )}

          {searchMutation.isError && !searchMutation.isPending && (
            <div className="m-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Search failed:{' '}
              {searchMutation.error instanceof Error
                ? searchMutation.error.message
                : 'Unknown error'}
            </div>
          )}

          {!searchMutation.isPending && searchMutation.isSuccess && results.length === 0 && (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              No results found.
            </div>
          )}

          {!searchMutation.isPending && scored.length > 0 && (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-border bg-muted/60 text-muted-foreground text-xs">
                  <th className="px-4 py-2 text-left font-medium">Title</th>
                  <th className="px-3 py-2 text-center font-medium w-[58px]">Type</th>
                  <th className="px-3 py-2 text-center font-medium w-[52px]">Seeds</th>
                  <th className="px-3 py-2 text-right font-medium w-[76px]">Size</th>
                  {showScores && <th className="px-3 py-2 text-center font-medium w-[52px]">Score</th>}
                  <th className="px-3 py-2 w-[82px]"></th>
                </tr>
              </thead>
              <tbody>
                {scored.map(({ result: r, score }, i) => {
                  const key = dlKey(r)
                  const state: DlState = dlStates[key] ?? 'idle'
                  const canDl = !!(r.download_url || r.magnet_url)
                  const isBest = key === topKey && topScore > 0 && i === 0

                  return (
                    <tr
                      key={i}
                      className={cn(
                        'border-b border-border last:border-0 hover:bg-muted/30',
                        isBest && 'bg-emerald-500/5',
                      )}
                    >
                      <td className="px-4 py-2.5 align-top">
                        <div className="font-medium text-foreground leading-snug line-clamp-2 flex items-start gap-1">
                          {isBest && <Star size={11} className="text-emerald-500 mt-0.5 shrink-0 fill-emerald-500" />}
                          {r.title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {r.indexer}{r.indexer && r.source ? ' · ' : ''}{r.source}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center align-top">
                        <span className={`text-xs font-semibold ${r.type === 'NZB' ? 'text-amber-500' : 'text-sky-500'}`}>
                          {r.type}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center align-top text-muted-foreground tabular-nums">
                        {r.seeders ?? '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right align-top text-muted-foreground tabular-nums">
                        {r.size_human}
                      </td>
                      {showScores && (
                        <td className="px-3 py-2.5 text-center align-top">
                          <span className="text-xs tabular-nums text-muted-foreground">{score}</span>
                        </td>
                      )}
                      <td className="px-3 py-2.5 text-right align-top">
                        {state === 'success' ? (
                          <span className="flex items-center justify-end gap-1 text-xs text-emerald-500">
                            <CheckCircle2 size={12} />Queued
                          </span>
                        ) : state === 'error' ? (
                          <span className="flex items-center justify-end gap-1 text-xs text-destructive">
                            <AlertCircle size={12} />Failed
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant={isBest ? 'default' : 'outline'}
                            className="h-7 text-xs px-2 gap-1"
                            disabled={!canDl || state === 'loading'}
                            onClick={() => handleDownload(r)}
                          >
                            {state === 'loading'
                              ? <Loader2 size={11} className="animate-spin" />
                              : <Download size={11} />}
                            {state === 'loading' ? 'Sending…' : 'Get'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </SheetContent>
    </>
  )
}
