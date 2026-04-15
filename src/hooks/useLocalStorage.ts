import { useState, useEffect, useCallback } from 'react'

/**
 * Like useState, but the value is persisted to localStorage under `key`.
 * Values are JSON-serialised. Falls back to `defaultValue` if the stored
 * value is missing or cannot be parsed.
 */
export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw !== null ? (JSON.parse(raw) as T) : defaultValue
    } catch {
      return defaultValue
    }
  })

  // Sync to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      // localStorage unavailable (private browsing quota exceeded, etc.) — ignore
    }
  }, [key, state])

  const set = useCallback((value: T | ((prev: T) => T)) => {
    setState(value)
  }, [])

  return [state, set]
}
