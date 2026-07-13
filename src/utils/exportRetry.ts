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

export function getExportRetryButtonLabel(mode: ExportJobMode): string {
  switch (mode) {
    case 'batch':
      return '同じ設定で章 ZIP を再試行'
    case 'sns':
      return '同じ設定で SNS 書き出しを再試行'
    default:
      return '同じ設定で再試行'
  }
}

export function getExportRetryHint(mode: ExportJobMode): string {
  switch (mode) {
    case 'batch':
      return '前回と同じ解像度・品質・章区間で ZIP 一括書き出しを再実行します。'
    case 'sns':
      return '前回と同じ 9:16・軽量設定で書き出しを再実行します。'
    default:
      return '前回と同じ解像度・品質・In/Out 範囲で書き出しを再実行します。'
  }
}
