import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: number | string | null | undefined
  icon: LucideIcon
  iconClassName?: string
  loading?: boolean
}

export function StatCard({ label, value, icon: Icon, iconClassName, loading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn('flex size-10 items-center justify-center rounded-lg bg-muted', iconClassName)}>
          <Icon size={18} className="text-muted-foreground" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          {loading ? (
            <div className="mt-1 h-6 w-12 animate-pulse rounded bg-muted" />
          ) : (
            <p className="text-2xl font-semibold tabular-nums text-foreground">{value ?? '—'}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
