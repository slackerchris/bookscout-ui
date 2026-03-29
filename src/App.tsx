import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SSEProvider } from '@/lib/sse/SSEContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import AppShell from '@/components/AppShell'
import DashboardPage from '@/pages/DashboardPage'
import AuthorsPage from '@/pages/AuthorsPage'
import AuthorDetailPage from '@/pages/AuthorDetailPage'
import ActivityPage from '@/pages/ActivityPage'
import IntegrationsPage from '@/pages/IntegrationsPage'
import DownloadsPage from '@/pages/DownloadsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SSEProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <Routes>
                <Route element={<AppShell />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="authors" element={<AuthorsPage />} />
                  <Route path="authors/:id" element={<AuthorDetailPage />} />
                  <Route path="downloads" element={<DownloadsPage />} />
                  <Route path="activity" element={<ActivityPage />} />
                  <Route path="integrations" element={<IntegrationsPage />} />
                </Route>
              </Routes>
            </ErrorBoundary>
          </BrowserRouter>
        </SSEProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}
