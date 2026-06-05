import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Save, RefreshCw } from 'lucide-react'
import { booksApi } from '@/lib/api/books'
import { bookKeys } from './useBooks'
import { toast } from 'sonner'
import type { BookRow } from './BooksTable'

interface Props {
  book: BookRow | null
  onClose: () => void
}

export default function EditBookDrawer({ book, onClose }: Props) {
  return (
    <Sheet open={!!book} onOpenChange={(open) => { if (!open) onClose() }}>
      {book && <EditBookContent key={book.id} book={book} onClose={onClose} />}
    </Sheet>
  )
}

function EditBookContent({ book, onClose }: { book: BookRow; onClose: () => void }) {
  const qc = useQueryClient()

  const [title, setTitle] = useState(book.title)
  const [subtitle, setSubtitle] = useState(book.subtitle ?? '')
  const [seriesName, setSeriesName] = useState(book.series_name ?? '')
  const [seriesPosition, setSeriesPosition] = useState(book.series_position ?? '')
  const [releaseDate, setReleaseDate] = useState(book.release_date ?? '')
  const [language, setLanguage] = useState(book.language ?? '')
  const [asin, setAsin] = useState(book.asin ?? '')
  const [isbn, setIsbn] = useState(book.isbn ?? '')
  const [isbn13, setIsbn13] = useState(book.isbn13 ?? '')
  const [narrator, setNarrator] = useState(book.narrator ?? '')

  const saveMutation = useMutation({
    mutationFn: () =>
      booksApi.update(book.id, {
        title: title.trim() || undefined,
        subtitle: subtitle.trim() || null,
        series_name: seriesName.trim() || null,
        series_position: seriesPosition.trim() || null,
        release_date: releaseDate.trim() || null,
        language: language.trim() || null,
        asin: asin.trim() || null,
        isbn: isbn.trim() || null,
        isbn13: isbn13.trim() || null,
        narrator: narrator.trim() || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookKeys.lists() })
      qc.invalidateQueries({ queryKey: bookKeys.counts() })
      toast.success('Book updated')
      onClose()
    },
    onError: () => toast.error('Failed to save changes'),
  })

  const rescanMutation = useMutation({
    mutationFn: () => booksApi.rescan(book.id),
    onSuccess: (data) => {
      toast.success(`Scan queued for author ${data.author_id}`)
    },
    onError: () => toast.error('Could not queue scan'),
  })

  return (
    <SheetContent className="flex flex-col w-[520px] sm:max-w-[520px] gap-0 p-0">
      <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
        <SheetTitle className="text-base">Edit book metadata</SheetTitle>
        <p className="text-sm text-muted-foreground truncate">{book.title}</p>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4 flex flex-col gap-4">
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-8 text-sm" />
        </Field>
        <Field label="Subtitle">
          <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="h-8 text-sm" placeholder="optional" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Series">
            <Input value={seriesName} onChange={(e) => setSeriesName(e.target.value)} className="h-8 text-sm" placeholder="Series name" />
          </Field>
          <Field label="Position">
            <Input value={seriesPosition} onChange={(e) => setSeriesPosition(e.target.value)} className="h-8 text-sm" placeholder="e.g. 1 or 1.5" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Release date">
            <Input value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} className="h-8 text-sm" placeholder="YYYY-MM-DD or YYYY" />
          </Field>
          <Field label="Language">
            <Input value={language} onChange={(e) => setLanguage(e.target.value)} className="h-8 text-sm" placeholder="en" />
          </Field>
        </div>
        <Field label="Narrator">
          <Input value={narrator} onChange={(e) => setNarrator(e.target.value)} className="h-8 text-sm" placeholder="e.g. Ray Porter" />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="ASIN">
            <Input value={asin} onChange={(e) => setAsin(e.target.value)} className="h-8 text-sm font-mono text-xs" />
          </Field>
          <Field label="ISBN">
            <Input value={isbn} onChange={(e) => setIsbn(e.target.value)} className="h-8 text-sm font-mono text-xs" />
          </Field>
          <Field label="ISBN-13">
            <Input value={isbn13} onChange={(e) => setIsbn13(e.target.value)} className="h-8 text-sm font-mono text-xs" />
          </Field>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5 text-muted-foreground"
          disabled={rescanMutation.isPending}
          onClick={() => rescanMutation.mutate()}
        >
          {rescanMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Rescan author
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            Save
          </Button>
        </div>
      </div>
    </SheetContent>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}
