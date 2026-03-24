import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ConfidenceBadge, BookStateBadge } from '@/components/StatusBadge'
import type { Book } from '@/types'

interface Props {
  books: Book[]
}

function bookState(b: Book): 'have_it' | 'missing' | 'unknown' {
  if (b.have_it) return 'have_it'
  if (b.missing) return 'missing'
  return 'unknown'
}

function RelativeTime({ iso }: { iso: string | null }) {
  if (!iso) return <span className="text-muted-foreground/50">—</span>
  const date = new Date(iso)
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  const label =
    minutes < 1 ? 'just now'
    : minutes < 60 ? `${minutes}m ago`
    : hours < 24 ? `${hours}h ago`
    : `${days}d ago`
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-muted-foreground cursor-default">{label}</span>
      </TooltipTrigger>
      <TooltipContent>{date.toLocaleString()}</TooltipContent>
    </Tooltip>
  )
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
            <TableHead className="w-[300px]">Title</TableHead>
            <TableHead className="w-[180px]">Author</TableHead>
            <TableHead className="w-[90px] text-center">Confidence</TableHead>
            <TableHead className="w-[90px]">Status</TableHead>
            <TableHead className="w-[110px]">Last scan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {books.map((book) => (
            <TableRow key={book.id}>
              <TableCell className="font-medium text-foreground">{book.title}</TableCell>
              <TableCell className="text-muted-foreground">{book.author}</TableCell>
              <TableCell className="text-center">
                <ConfidenceBadge band={book.confidence_band} score={book.score} />
              </TableCell>
              <TableCell>
                <BookStateBadge state={bookState(book)} />
              </TableCell>
              <TableCell>
                <RelativeTime iso={book.last_scan_at} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}


