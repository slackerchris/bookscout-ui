import { Activity } from 'lucide-react'

// Placeholder — the active-jobs endpoint does not exist in BookScout v1.
// Component kept to avoid breaking imports; renders an empty state.
interface Props {
  jobs: unknown[]
}

export default function ActiveJobsList({ jobs: _ }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
      <Activity size={20} className="opacity-40" />
      <p className="text-sm">No active jobs</p>
    </div>
  )
}
