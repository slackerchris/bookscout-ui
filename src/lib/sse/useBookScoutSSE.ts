import { useEffect, useRef } from 'react'
import type { BookScoutEvent } from '@/types'

type Handler = (event: BookScoutEvent) => void

/**
 * Subscribe to the BookScout SSE event stream.
 *
 * The hook reconnects automatically on error with a short back-off.
 * Pass `onEvent` to handle incoming events — it is stable-ref'd internally
 * so callers don't need to memoize it.
 */
export function useBookScoutSSE(onEvent: Handler) {
  const handlerRef = useRef<Handler>(onEvent)
  handlerRef.current = onEvent

  useEffect(() => {
    let es: EventSource | null = null
    let retryTimeout: ReturnType<typeof setTimeout> | null = null
    let destroyed = false

    function connect() {
      es = new EventSource('/api/v1/events')

      es.onmessage = (e) => {
        try {
          const raw = JSON.parse(e.data) as Record<string, unknown>
          // The real BookScout SSE payload uses `event` as the discriminator.
          // Fall back to `event_type` / `type` for forward-compatibility.
          const event_type = String(raw.event ?? raw.event_type ?? raw.type ?? 'unknown')
          const timestamp = String(raw.timestamp ?? new Date().toISOString())
          const event: BookScoutEvent = { event_type, timestamp, payload: raw }
          handlerRef.current(event)
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
}
