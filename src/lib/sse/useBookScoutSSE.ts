import { useEffect, useRef } from 'react'
import type { BookScoutEvent } from '@/types'
import { useSSEContext } from './sse-context'

type Handler = (event: BookScoutEvent) => void

/**
 * Subscribe to the BookScout SSE event stream.
 *
 * Uses the singleton SSEContext so all callers share one EventSource
 * connection rather than each opening their own.
 */
export function useBookScoutSSE(onEvent: Handler) {
  const { subscribe } = useSSEContext()
  const handlerRef = useRef<Handler>(onEvent)

  useEffect(() => {
    handlerRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    return subscribe((event) => handlerRef.current(event))
  }, [subscribe])
}
