import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authorsApi } from '@/lib/api/authors'

const favoritesKey = ['authors', 'favorites'] as const

export function useFavoriteAuthors() {
  const qc = useQueryClient()

  const { data } = useQuery({
    queryKey: favoritesKey,
    queryFn: () => authorsApi.favorites(),
    staleTime: 5 * 60_000,
  })

  const favorites = useMemo(
    () => new Set<number>(data?.author_ids ?? []),
    [data],
  )

  const addMutation = useMutation({
    mutationFn: (id: number) => authorsApi.addFavorite(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: favoritesKey })
      const prev = qc.getQueryData<{ author_ids: number[] }>(favoritesKey)
      qc.setQueryData<{ author_ids: number[] }>(favoritesKey, (old) => ({
        author_ids: [...(old?.author_ids ?? []), id],
      }))
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(favoritesKey, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: favoritesKey }),
  })

  const removeMutation = useMutation({
    mutationFn: (id: number) => authorsApi.removeFavorite(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: favoritesKey })
      const prev = qc.getQueryData<{ author_ids: number[] }>(favoritesKey)
      qc.setQueryData<{ author_ids: number[] }>(favoritesKey, (old) => ({
        author_ids: (old?.author_ids ?? []).filter((x) => x !== id),
      }))
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(favoritesKey, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: favoritesKey }),
  })

  function toggle(id: number) {
    if (favorites.has(id)) {
      removeMutation.mutate(id)
    } else {
      addMutation.mutate(id)
    }
  }

  return { favorites, toggle }
}
