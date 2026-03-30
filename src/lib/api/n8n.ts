import { api } from './client'

export interface N8nExecutionItem {
  name: string
  book_id: string | null
  result: 'imported' | 'failed' | 'unknown'
  content_path: string
}

export interface N8nExecution {
  id: string
  status: 'success' | 'error' | 'running' | 'waiting' | 'unknown'
  started_at: string | null
  stopped_at: string | null
  items: N8nExecutionItem[]
}

export const N8N_WORKFLOW_ID = 'SwTAfQEy3XagttAp'

export const n8nApi = {
  executions: (workflowId: string, limit = 20) =>
    api.get<N8nExecution[]>(`/n8n/executions?workflow_id=${workflowId}&limit=${limit}`),
}
