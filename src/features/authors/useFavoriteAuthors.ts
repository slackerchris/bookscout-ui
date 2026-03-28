import { useState } from 'react'

const STORAGE_KEY = 'bookscout_favorite_authors'

function readFavorites(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw) as number[]) : new Set()
  } catch {
    return new Set()
  }
}

function writeFavorites(ids: Set<number>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

export function useFavoriteAuthors() {
  const [favorites, setFavorites] = useState<Set<number>>(() => readFavorites())

  function toggle(id: number) {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      writeFavorites(next)
      return next
    })
  }

  return { favorites, toggle }
}
