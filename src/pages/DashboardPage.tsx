import { useQueryClient } from '@tanstack/react-query'
import {
  useMissingCounts,
  useHighConfidenceMissing,
  dashboardKeys,
} from '@/features/dashboard/useDashboard'
import { StatCard } from '@/features/dashboard/StatCard'
import { ConfidenceBadge, BookStateBadge } from '@/components/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useBookScoutSSE } from '@/lib/sse/useBookScoutSSE'
import type { BookScoutEvent } from '@/types'
import { BookX, Zap, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const qc = useQueryClient()
  const counts = useMissingCounts()
  const highConf = useHighConfidenceMissing()

  // Live: refresh relevant queries when a scan completes
  useBookScoutSSE((event: BookScoutEvent) => {
    if (event.event_type === 'scan.complete') {
      qc.invalidateQueries({ queryKey: dashboardKeys.missingCount })
      qc.invalidateQueries({ queryKey: dashboardKeys.highConfidenceCount })
      qc.invalidateQueries({ queryKey: dashboardKeys.highConfidence })
    }
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">BookScout control panel</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Missing books"
          value={counts.missing.data}
          icon={BookX}
          loading={counts.missing.isLoading}
        />
        <StatCard
          label="High confidence"
          value={counts.highConf.data}
          icon={Zap}
          loading={counts.highConf.isLoading}
          iconClassName="bg-orange-500/10"
        />
        <StatCard
          label="Authors tracked"
          value={counts.authors.data}
          icon={Users}
          loading={counts.authors.isLoading}
          iconClassName="bg-blue-500/10"
        />
      </div>

      {/* High confidence missing */}
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">High-confidence missing books</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" asChild>
              <Link to="/missing-books">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {highConf.isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-8 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : !highConf.data?.length ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                No high-confidence missing books — you're all caught up.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Title</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">Confidence</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
              {highConf.data.map((book) => (
                    <tr key={book.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-foreground">{book.title}</td>
                      <td className="px-4 py-2.5 text-center">
                        <ConfidenceBadge band={book.confidence_band} score={book.score} />
                      </td>
                      <td className="px-4 py-2.5">
                        <BookStateBadge
                          state={book.have_it ? 'have_it' : 'missing'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
