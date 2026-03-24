import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfidenceBadge, BookStateBadge } from '@/components/StatusBadge'
import type { Book } from '@/types'

interface Props {
  books: Book[]
}

function bookState(b: Book): 'have_it' | 'missing' {
  return b.have_it ? 'have_it' : 'missing'
}

export default function BooksTable({ books }: Props) {
  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
        <p className="text-sm">No books match your filters.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Title</TableHead>
            <TableHead className="w-[110px] text-center">Confidence</TableHead>
            <TableHead className="w-[90px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {books.map((book) => (
            <TableRow key={book.id}>
              <TableCell className="font-medium text-foreground">{book.title}</TableCell>
              <TableCell className="text-center">
                <ConfidenceBadge band={book.confidence_band} score={book.score} />
              </TableCell>
              <TableCell>
                <BookStateBadge state={bookState(book)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}


