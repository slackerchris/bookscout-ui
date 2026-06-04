import {
  useCallback,
  useEffect,
  useRef,
} from 'react'
import type { BookScoutEvent } from '@/types'
import { SSEContext, type Handler } from './sse-context'

/**
 * Singleton SSE provider.
 *
 * Maintains ONE EventSource connection to /api/v1/events and fans out
 * parsed BookScoutEvents to all registered subscribers. Reconnects with
 * a 3-second back-off on errors.
 *
 * Without this, each page that called useBookScoutSSE directly would open
 * a separate EventSource — tripling Redis pub/sub subscriptions on the server.
 */
export function SSEProvider({ children }: { children: React.ReactNode }) {
  const handlers = useRef(new Set<Handler>())

  useEffect(() => {
    let es: EventSource | null = null
    let retryTimeout: ReturnType<typeof setTimeout> | null = null
    let destroyed = false

    function connect() {
      es = new EventSource('/api/v1/events')

      es.onmessage = (e) => {
        try {
          const raw = JSON.parse(e.data) as Record<string, unknown>
          const event_type = String(raw.event ?? raw.event_type ?? raw.type ?? 'unknown')
          const timestamp = String(raw.timestamp ?? new Date().toISOString())
          const event: BookScoutEvent = { event_type, timestamp, payload: raw }
          handlers.current.forEach((h) => h(event))
        } catch {
          // ignore malformed frames
        }
      }

      es.onerror = () => {
        es?.close()
        if (!destroyed) {
          retryTimeout = setTimeout(connect, 3_000)
        }
      }
    }

    connect()

    return () => {
      destroyed = true
      if (retryTimeout) clearTimeout(retryTimeout)
      es?.close()
    }
  }, [])

  const subscribe = useCallback((handler: Handler) => {
    handlers.current.add(handler)
    return () => {
      handlers.current.delete(handler)
    }
  }, [])

  return <SSEContext.Provider value={{ subscribe }}>{children}</SSEContext.Provider>
}
