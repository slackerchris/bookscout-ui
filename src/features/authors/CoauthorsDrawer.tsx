import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'
import type { Author } from '@/types'

interface Props {
  author: Author | null
  onClose: () => void
}

export default function CoauthorsDrawer({ author, onClose }: Props) {
  return (
    <Sheet open={!!author} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent className="w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Users size={15} />
            Coauthors
          </SheetTitle>
          {author && (
            <p className="text-sm text-muted-foreground">{author.name}</p>
          )}
        </SheetHeader>
        <div className="mt-4">
          {!author?.coauthors.length ? (
            <p className="text-sm text-muted-foreground">No coauthors tracked for this author.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {author.coauthors.map((name) => (
                <li key={name} className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-normal">{name}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
