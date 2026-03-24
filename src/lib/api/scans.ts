import { api } from './client'

export interface ScanQueuedResponse {
  job_id: string
  status: 'queued'
}

export interface JobStatusResponse {
  job_id: string
  status: string
  result?: unknown
}

export const scansApi = {
  scanAll: () => api.post<ScanQueuedResponse>('/scans/all'),
  jobStatus: (jobId: string) => api.get<JobStatusResponse>(`/scans/job/${jobId}`),
}
