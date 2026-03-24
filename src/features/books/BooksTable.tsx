import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ConfidenceBadge, BookStateBadge } from '@/components/StatusBadge'
import { Search, Download, EyeOff, CheckCircle, RotateCcw, Loader2 } from 'lucide-react'
import type { Book } from '@/types'

interface ActionState {
  search: { isPending: boolean; mutate: (id: string) => void }
  download: { isPending: boolean; mutate: (id: string) => void }
  ignore: { isPending: boolean; mutate: (id: string) => void }
  markOwned: { isPending: boolean; mutate: (id: string) => void }
}

interface Props {
  books: Book[]
  actions: ActionState
  activeId: string | null
  onActiveIdChange: (id: string | null) => void
}

function bookState(b: Book): 'owned' | 'ignored' | 'wanted' | 'missing' {
  if (b.owned) return 'owned'
  if (b.ignored) return 'ignored'
  if (b.wanted) return 'wanted'
  return 'missing'
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

export default function BooksTable({ books, actions, activeId, onActiveIdChange }: Props) {
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
            <TableHead className="w-[180px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {books.map((book) => {
            const isActive = activeId === book.id
            const busy = actions.search.isPending || actions.download.isPending ||
              actions.ignore.isPending || actions.markOwned.isPending

            return (
              <TableRow
                key={book.id}
                className={isActive ? 'bg-accent/40' : undefined}
                onClick={() => onActiveIdChange(isActive ? null : book.id)}
              >
                <TableCell className="font-medium text-foreground">
                  {book.title}
                </TableCell>
                <TableCell className="text-muted-foreground">{book.author}</TableCell>
                <TableCell className="text-center">
                  <ConfidenceBadge value={book.confidence} />
                </TableCell>
                <TableCell>
                  <BookStateBadge state={bookState(book)} />
                </TableCell>
                <TableCell>
                  <RelativeTime iso={book.last_scan_at} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={busy || book.owned || book.ignored}
                          onClick={(e) => { e.stopPropagation(); actions.search.mutate(book.id) }}
                        >
                          {actions.search.isPending && activeId === book.id
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Search size={14} />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Search</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={busy || book.owned || book.ignored}
                          onClick={(e) => { e.stopPropagation(); actions.download.mutate(book.id) }}
                        >
                          {actions.download.isPending && activeId === book.id
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Download size={14} />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={busy || book.owned}
                          onClick={(e) => { e.stopPropagation(); actions.markOwned.mutate(book.id) }}
                        >
                          <CheckCircle size={14} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Mark owned</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={busy || book.owned}
                          onClick={(e) => {
                            e.stopPropagation()
                            book.ignored
                              ? actions.search.mutate(book.id) // retry = re-search
                              : actions.ignore.mutate(book.id)
                          }}
                        >
                          {book.ignored
                            ? <RotateCcw size={14} />
                            : <EyeOff size={14} />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{book.ignored ? 'Retry' : 'Ignore'}</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
