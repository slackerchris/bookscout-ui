import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Users, Loader2 } from 'lucide-react'
import { useCoauthors } from './useAuthors'

interface Props {
  authorId: string | null
  authorName: string | null
  onClose: () => void
}

export default function CoauthorsDrawer({ authorId, authorName, onClose }: Props) {
  const { data: coauthors, isLoading } = useCoauthors(authorId)

  return (
    <Sheet open={!!authorId} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent className="w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Users size={15} />
            Coauthors
          </SheetTitle>
          {authorName && (
            <p className="text-sm text-muted-foreground">{authorName}</p>
          )}
        </SheetHeader>
        <div className="mt-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 size={13} className="animate-spin" />
              Loading…
            </div>
          ) : !coauthors?.length ? (
            <p className="text-sm text-muted-foreground">No coauthors tracked for this author.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {coauthors.map((c) => (
                <li key={c.id} className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-normal">{c.name}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
