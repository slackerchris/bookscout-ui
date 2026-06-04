import { createContext, useContext } from 'react'
import type { BookScoutEvent } from '@/types'

export type Handler = (event: BookScoutEvent) => void

export interface SSEContextValue {
  /** Register a handler, returns an unsubscribe function. */
  subscribe: (handler: Handler) => () => void
}

export const SSEContext = createContext<SSEContextValue | null>(null)

export function useSSEContext(): SSEContextValue {
  const ctx = useContext(SSEContext)
  if (!ctx) throw new Error('useSSEContext must be used within <SSEProvider>')
  return ctx
}
