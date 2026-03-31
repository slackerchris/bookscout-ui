import type { DownloadQueueItem } from '@/lib/api'

export function normalizeProgress(item: DownloadQueueItem): number {
  if (item.progress !== undefined) return Math.min(100, Math.max(0, item.progress))
  if (item.percentage !== undefined) return Math.min(100, Math.max(0, parseFloat(item.percentage) || 0))
  return 0
}

export function formatEta(eta: number | string | undefined): string | null {
  if (eta === undefined || eta === null) return null
  if (typeof eta === 'string') {
    if (eta === 'unknown' || eta === '') return null
    return eta
  }
  if (eta < 0 || eta > 86400 * 7) return null
  const h = Math.floor(eta / 3600)
  const m = Math.floor((eta % 3600) / 60)
  const s = Math.floor(eta % 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function formatBytes(bytes: number | string | undefined): string | null {
  if (bytes === undefined || bytes === null) return null
  if (typeof bytes === 'string') {
    const n = parseFloat(bytes)
    if (isNaN(n)) return null
    return `${n.toFixed(0)} MB`
  }
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export const STATUS_DOT: Record<string, string> = {
  downloading:   'bg-blue-500',
  uploading:     'bg-emerald-500',
  seeding:       'bg-emerald-500',
  stalledDL:     'bg-yellow-500',
  stalledUP:     'bg-yellow-500',
  pausedDL:      'bg-zinc-400',
  pausedUP:      'bg-zinc-400',
  checkingDL:    'bg-violet-500',
  checkingUP:    'bg-violet-500',
  error:         'bg-red-500',
  stopped:       'bg-zinc-400',
  download_wait: 'bg-yellow-500',
  check_wait:    'bg-violet-500',
  checking:      'bg-violet-500',
  seed_wait:     'bg-yellow-500',
  Downloading:   'bg-blue-500',
  Paused:        'bg-zinc-400',
  Queued:        'bg-yellow-500',
  Fetching:      'bg-violet-500',
  Completed:     'bg-emerald-500',
  Failed:        'bg-red-500',
}

export function statusDot(status: string): string {
  return STATUS_DOT[status] ?? 'bg-zinc-400'
}

export function normalizeStatus(status: string): string {
  const s = status.toLowerCase()
  if (s === 'stalleddl') return 'Stalled'
  if (s === 'stalledup' || s === 'uploading' || s === 'seeding' || s === 'seed_wait') return 'Seeding'
  if (s === 'downloading' || s === 'downloading metadata') return 'Downloading'
  if (s === 'pauseddl' || s === 'pausedup' || s === 'paused') return 'Paused'
  if (s === 'checkingdl' || s === 'checkingup' || s === 'checking' || s === 'check_wait') return 'Checking'
  if (s === 'download_wait' || s === 'queued') return 'Queued'
  if (s === 'completed') return 'Completed'
  if (s === 'stopped') return 'Stopped'
  if (s === 'failed' || s === 'error') return 'Error'
  return status
}

const AUDIOBOOK_HINTS = ['audiobook', 'audiobooks', '/audiobooks', '\\audiobooks']

export function isAudiobookDownload(item: DownloadQueueItem): boolean {
  const haystacks = [item.category, item.save_path, item.title]
    .filter(Boolean)
    .map((value) => value!.toLowerCase())
  return haystacks.some((value) => AUDIOBOOK_HINTS.some((hint) => value.includes(hint)))
}

export function bucketStatus(item: DownloadQueueItem): 'downloading' | 'paused' | 'completed' | 'other' {
  const progress = normalizeProgress(item)
  const s = item.status.toLowerCase()
  if (progress >= 100 || s === 'completed' || s === 'seeding') return 'completed'
  if (s === 'paused' || s === 'pauseddl' || s === 'pausedup' || s === 'stopped') return 'paused'
  if (s === 'downloading' || s === 'download_wait' || s === 'queued' || s === 'fetching') return 'downloading'
  return 'other'
}

export function statusRank(item: DownloadQueueItem): number {
  const bucket = bucketStatus(item)
  if (bucket === 'downloading') return 0
  if (bucket === 'paused') return 1
  if (bucket === 'other') return 2
  return 3
}
