import type { Project } from '../types/project'
import { formatBytes } from '../utils/formatBytes'

export const LARGE_FILE_BYTES = 500 * 1024 * 1024
export const LARGE_PROJECT_BYTES = 200 * 1024 * 1024

export interface StorageEstimate {
  usage: number
  quota: number
}

export function estimateProjectStorageBytes(project: Project): number {
  return project.mediaAssets.reduce((sum, asset) => sum + asset.blob.size, 0)
}

export function isQuotaExceededError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const name = 'name' in err ? String(err.name) : ''
  const message = 'message' in err ? String(err.message) : ''
  return (
    name === 'QuotaExceededError' ||
    message.includes('QuotaExceeded') ||
    message.includes('quota')
  )
}

export function formatStorageError(err: unknown): string {
  if (isQuotaExceededError(err)) {
    return 'ブラウザの保存容量が不足しています。不要なメディアを削除するか、古いプロジェクトを整理してください'
  }
  if (err instanceof Error && err.message) return `自動保存に失敗しました: ${err.message}`
  return '自動保存に失敗しました'
}

export function formatStorageUsageLabel(estimate: StorageEstimate): string {
  const usage = formatBytes(estimate.usage)
  const quota = formatBytes(estimate.quota)
  const percent = estimate.quota > 0 ? Math.round((estimate.usage / estimate.quota) * 100) : 0
  return `${usage} / ${quota}（${percent}%）`
}

export async function getStorageEstimate(): Promise<StorageEstimate | null> {
  if (!navigator.storage?.estimate) return null
  try {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate()
    return { usage, quota }
  } catch {
    return null
  }
}
