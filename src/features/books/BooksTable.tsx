import { useState } from 'react'
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
import { Search } from 'lucide-react'
import type { Book } from '@/types'
import SearchDownloadDrawer from './SearchDownloadDrawer'

export type BookRow = Book & { author_name: string; author_id: number }

interface Props {
  books: BookRow[]
}

function bookState(b: Book): 'have_it' | 'missing' {
  return b.have_it ? 'have_it' : 'missing'
}

export default function BooksTable({ books }: Props) {
  const [selectedBook, setSelectedBook] = useState<BookRow | null>(null)

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
        <p className="text-sm">No books match your filters.</p>
      </div>
    )
  }

  const showAuthor = books.some((b) => b.author_name)

  return (
    <>
      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {showAuthor && <TableHead className="w-[180px]">Author</TableHead>}
              <TableHead>Title</TableHead>
              <TableHead className="w-[110px] text-center">Confidence</TableHead>
              <TableHead className="w-[90px]">Status</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {books.map((book) => (
              <TableRow key={book.id}>
                {showAuthor && (
                  <TableCell className="text-sm text-foreground align-top">
                    {book.author_name}
                  </TableCell>
                )}
                <TableCell className="font-medium text-foreground">
                  <div>{book.title}</div>
                  {book.series_name && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {book.series_name}
                      {book.series_position ? ` · #${book.series_position}` : ''}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-center align-top">
                  <ConfidenceBadge band={book.confidence_band} score={book.score} />
                </TableCell>
                <TableCell className="align-top">
                  <BookStateBadge state={bookState(book)} />
                </TableCell>
                <TableCell className="align-top">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    title="Find download"
                    onClick={() => setSelectedBook(book)}
                  >
                    <Search size={13} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <SearchDownloadDrawer
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
      />
    </>
  )
}


