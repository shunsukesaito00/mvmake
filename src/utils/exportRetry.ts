import type { ExportQuality } from '../engine/exporter'
import type { ExportResolution } from '../types/exportPreset'

export type ExportJobMode = 'single' | 'batch' | 'sns'

export type ExportJobSnapshot = {
  mode: ExportJobMode
  resolution: ExportResolution
  quality: ExportQuality
}

export function isRetryableExportJob(job: ExportJobSnapshot | null | undefined): job is ExportJobSnapshot {
  return job != null
}

export function getExportRetryButtonLabel(
  mode: ExportJobMode,
  failedChapterCount = 0,
  resumableChapterCount = 0,
): string {
  switch (mode) {
    case 'batch':
      if (failedChapterCount > 0) return `失敗した ${failedChapterCount} 章のみ再試行`
      if (resumableChapterCount > 0) return '残りの章から再開'
      return '同じ設定で章 ZIP を再試行'
    case 'sns':
      return '同じ設定で SNS 書き出しを再試行'
    default:
      return '同じ設定で再試行'
  }
}

export function getExportRetryHint(
  mode: ExportJobMode,
  failedChapterCount = 0,
  resumableChapterCount = 0,
): string {
  switch (mode) {
    case 'batch':
      if (failedChapterCount > 0) {
        return '完了済みの章はそのまま保持し、失敗した章だけを再書き出しします。'
      }
      if (resumableChapterCount > 0) {
        return '完了済みの章はそのまま保持し、未完了の章だけを書き出します。'
      }
      return '前回と同じ解像度・品質・章区間で ZIP 一括書き出しを再実行します。'
    case 'sns':
      return '前回と同じ 9:16・軽量設定で書き出しを再実行します。'
    default:
      return '前回と同じ解像度・品質・In/Out 範囲で書き出しを再実行します。'
  }
}
