import { api } from './client'

export interface SeriesBook {
  id: number
  title: string
  series_position: string | null
  position: number | null
  have_it: boolean
  release_date: string | null
  confidence_band: 'high' | 'medium' | 'low'
  cover_url: string | null
}

export interface Series {
  series_name: string
  author_id: number | null
  author_name: string | null
  total: number
  owned: number
  books: SeriesBook[]
  /** Whole-number positions in 1..max absent from the catalog entirely */
  unknown_gaps: number[]
}

export interface SeriesParams {
  missing_only?: boolean
  author_id?: number
  min_books?: number
}

export const seriesApi = {
  list: (params: SeriesParams = {}) => {
    const parts: string[] = []
    if (params.missing_only) parts.push('missing_only=true')
    if (params.author_id != null) parts.push(`author_id=${params.author_id}`)
    if (params.min_books != null) parts.push(`min_books=${params.min_books}`)
    return api.get<Series[]>(`/series/${parts.length ? `?${parts.join('&')}` : ''}`)
  },
}
