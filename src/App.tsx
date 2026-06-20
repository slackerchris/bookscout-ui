import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SSEProvider } from '@/lib/sse/SSEContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import AppShell from '@/components/AppShell'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { useBookScoutSSE } from '@/lib/sse/useBookScoutSSE'
import type { ImportCompletePayload } from '@/types'

const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const AuthorsPage = lazy(() => import('@/pages/AuthorsPage'))
const AuthorDetailPage = lazy(() => import('@/pages/AuthorDetailPage'))
const ReleasesPage = lazy(() => import('@/pages/ReleasesPage'))
const DownloadsPage = lazy(() => import('@/pages/DownloadsPage'))
const ActivityPage = lazy(() => import('@/pages/ActivityPage'))
const IntegrationsPage = lazy(() => import('@/pages/IntegrationsPage'))
const ConfigPage = lazy(() => import('@/pages/ConfigPage'))
const CoAuthorManagementPage = lazy(() => import('@/pages/CoAuthorManagementPage'))

function isImportCompletePayload(p: unknown): p is ImportCompletePayload {
  return (
    typeof p === 'object' && p !== null &&
    typeof (p as Record<string, unknown>).book_title === 'string' &&
    typeof (p as Record<string, unknown>).author_name === 'string'
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

function ImportNotifier() {
  const qc = useQueryClient()
  useBookScoutSSE((event) => {
    if (event.event_type !== 'import.complete') return
    if (!isImportCompletePayload(event.payload)) return
    const p = event.payload
    toast.success(`Imported: ${p.book_title}`, {
      description: p.author_name,
      duration: 6000,
    })
    qc.invalidateQueries({ queryKey: ['downloads', 'recently-imported'] })
  })
  return null
}

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
      Loading…
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SSEProvider>
          <Toaster position="bottom-right" richColors />
          <BrowserRouter>
            <ErrorBoundary>
              <ImportNotifier />
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route element={<AppShell />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="authors" element={<AuthorsPage />} />
                    <Route path="authors/:id" element={<AuthorDetailPage />} />
                    <Route path="releases" element={<ReleasesPage />} />
                    <Route path="downloads" element={<DownloadsPage />} />
                    <Route path="activity" element={<ActivityPage />} />
                    <Route path="integrations" element={<IntegrationsPage />} />
                    <Route path="settings" element={<ConfigPage />} />
                    <Route path="co-authors" element={<CoAuthorManagementPage />} />
                  </Route>
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
        </SSEProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}
