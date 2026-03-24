import { useQueryClient } from '@tanstack/react-query'
import {
  useMissingCounts,
  useRecentEvents,
  useActiveJobs,
  useHighConfidenceMissing,
  dashboardKeys,
} from '@/features/dashboard/useDashboard'
import { StatCard } from '@/features/dashboard/StatCard'
import EventFeed from '@/features/dashboard/EventFeed'
import ActiveJobsList from '@/features/dashboard/ActiveJobsList'
import { ConfidenceBadge, BookStateBadge } from '@/components/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useBookScoutSSE } from '@/lib/sse/useBookScoutSSE'
import type { BookScoutEvent } from '@/types'
import {
  BookX,
  Zap,
  Users,
  Activity,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const qc = useQueryClient()
  const counts = useMissingCounts()
  const events = useRecentEvents()
  const jobs = useActiveJobs()
  const highConf = useHighConfidenceMissing()

  // Live: refresh relevant queries when events arrive
  useBookScoutSSE((event: BookScoutEvent) => {
    qc.invalidateQueries({ queryKey: dashboardKeys.recentEvents })

    if (
      event.event_type === 'scan_completed' ||
      event.event_type === 'missing_book_found' ||
      event.event_type === 'download_completed'
    ) {
      qc.invalidateQueries({ queryKey: dashboardKeys.missingCount })
      qc.invalidateQueries({ queryKey: dashboardKeys.highConfidenceCount })
      qc.invalidateQueries({ queryKey: dashboardKeys.highConfidence })
    }

    if (
      event.event_type === 'download_queued' ||
      event.event_type === 'download_completed' ||
      event.event_type === 'action_failed'
    ) {
      qc.invalidateQueries({ queryKey: dashboardKeys.activeJobs })
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

      {/* Main content: two columns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* High confidence missing */}
        <Card className="lg:col-span-2">
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
            ) : !highConf.data?.items.length ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                No high-confidence missing books — you're all caught up.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Title</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Author</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">Confidence</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {highConf.data.items.map((book) => (
                    <tr key={book.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-foreground">{book.title}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{book.author}</td>
                      <td className="px-4 py-2.5 text-center">
                        <ConfidenceBadge band={book.confidence_band} score={book.score} />
                      </td>
                      <td className="px-4 py-2.5">
                        <BookStateBadge
                          state={book.have_it ? 'have_it' : book.missing ? 'missing' : 'unknown'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Active jobs */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Active jobs</CardTitle>
              {!!jobs.data?.items.length && (
                <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                  {jobs.data.items.length}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ActiveJobsList jobs={jobs.data?.items ?? []} />
          </CardContent>
        </Card>

        {/* Recent events */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Recent events</CardTitle>
              <span className="ml-1 size-1.5 rounded-full bg-green-500 animate-pulse" title="Live" />
            </div>
          </CardHeader>
          <CardContent>
            <EventFeed events={events.data?.items.slice(0, 12) ?? []} />
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
