import { useEffect } from 'react'

export interface Shortcut {
  /** Key to match (e.g. 's', 'Enter', 'Escape'). Case-insensitive. */
  key: string
  /** Require Alt modifier */
  alt?: boolean
  /** Require Shift modifier */
  shift?: boolean
  /** Callback when the shortcut fires */
  handler: () => void
  /** Skip when an input/textarea/select has focus */
  ignoreInputs?: boolean
}

/**
 * Register keyboard shortcuts for the lifetime of the calling component.
 * All shortcuts are automatically unregistered on unmount.
 */
export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      for (const s of shortcuts) {
        const keyMatches = e.key.toLowerCase() === s.key.toLowerCase()
        const altOk = s.alt ? e.altKey : !e.altKey
        const shiftOk = s.shift ? e.shiftKey : true  // shift is optional unless required
        if (!keyMatches || !altOk || !shiftOk) continue

        const ignoreInputs = s.ignoreInputs !== false  // default true
        if (ignoreInputs) {
          const tag = (e.target as HTMLElement).tagName
          if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') continue
          if ((e.target as HTMLElement).isContentEditable) continue
        }

        e.preventDefault()
        s.handler()
        break
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [shortcuts])
}
