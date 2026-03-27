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
import { Search, Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { searchApi, type SearchResult } from '@/lib/api/search'
import type { BookRow } from './BooksTable'

interface Props {
  book: BookRow | null
  onClose: () => void
}

type DlState = 'idle' | 'loading' | 'success' | 'error'

function dlKey(r: SearchResult): string {
  return r.download_url || r.magnet_url || r.title
}

export default function SearchDownloadDrawer({ book, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [dlStates, setDlStates] = useState<Record<string, DlState>>({})

  const searchMutation = useMutation({
    mutationFn: (q: string) => searchApi.search(q),
    onSuccess: (data) => setResults(data),
  })

  // Stable ref so useEffect can call mutate without it being a dependency
  const mutateRef = useRef(searchMutation.mutate)
  mutateRef.current = searchMutation.mutate

  // Reset state and auto-search when the drawer opens for a new book
  useEffect(() => {
    if (book) {
      const q = book.author_name ? `${book.title} ${book.author_name}` : book.title
      setQuery(q)
      setResults([])
      setDlStates({})
      mutateRef.current(q)
    }
  }, [book?.id]) // eslint-disable-line react-hooks/exhaustive-deps

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
        book_id: book?.id ?? 0,
      })
      setDlStates((s) => ({ ...s, [key]: 'success' }))
    } catch {
      setDlStates((s) => ({ ...s, [key]: 'error' }))
    }
  }

  return (
    <Sheet open={!!book} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent className="flex flex-col w-[680px] sm:max-w-[680px] gap-0 p-0">
        <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Search size={15} />
            Find Download
          </SheetTitle>
          {book && (
            <p className="text-sm text-muted-foreground truncate">
              {book.title}
              {book.author_name ? ` · ${book.author_name}` : ''}
            </p>
          )}
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

          {!searchMutation.isPending && results.length > 0 && (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-border bg-muted/60 text-muted-foreground text-xs">
                  <th className="px-4 py-2 text-left font-medium">Title</th>
                  <th className="px-3 py-2 text-center font-medium w-[58px]">Type</th>
                  <th className="px-3 py-2 text-center font-medium w-[52px]">Seeds</th>
                  <th className="px-3 py-2 text-right font-medium w-[76px]">Size</th>
                  <th className="px-3 py-2 w-[82px]"></th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => {
                  const key = dlKey(r)
                  const state: DlState = dlStates[key] ?? 'idle'
                  const canDl = !!(r.download_url || r.magnet_url)

                  return (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2.5 align-top">
                        <div className="font-medium text-foreground leading-snug line-clamp-2">
                          {r.title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {r.indexer}{r.indexer && r.source ? ' · ' : ''}{r.source}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center align-top">
                        <span
                          className={`text-xs font-semibold ${
                            r.type === 'NZB' ? 'text-amber-500' : 'text-sky-500'
                          }`}
                        >
                          {r.type}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center align-top text-muted-foreground tabular-nums">
                        {r.seeders ?? '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right align-top text-muted-foreground tabular-nums">
                        {r.size_human}
                      </td>
                      <td className="px-3 py-2.5 text-right align-top">
                        {state === 'success' ? (
                          <span className="flex items-center justify-end gap-1 text-xs text-emerald-500">
                            <CheckCircle2 size={12} />
                            Queued
                          </span>
                        ) : state === 'error' ? (
                          <span className="flex items-center justify-end gap-1 text-xs text-destructive">
                            <AlertCircle size={12} />
                            Failed
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
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
    </Sheet>
  )
}
