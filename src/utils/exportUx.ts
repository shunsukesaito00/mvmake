export interface ExportEtaEstimate {
  remainingSeconds: number | null
  label: string
}

export interface ExportErrorPresentation {
  title: string
  detail: string
}

export function formatExportDuration(seconds: number): string {
  const total = Math.max(0, Math.ceil(seconds))
  const mins = Math.floor(total / 60)
  const secs = total % 60
  if (mins <= 0) return `${secs}秒`
  return `${mins}分${secs.toString().padStart(2, '0')}秒`
}

export function estimateExportEta(progress: number, elapsedMs: number): ExportEtaEstimate {
  if (progress <= 0.05 || elapsedMs < 1000 || !Number.isFinite(progress)) {
    return { remainingSeconds: null, label: '残り時間を計算中…' }
  }

  const rate = progress / elapsedMs
  if (rate <= 0) {
    return { remainingSeconds: null, label: '残り時間を計算中…' }
  }

  const remainingSeconds = Math.max(0, Math.ceil((1 - progress) / rate / 1000))
  return {
    remainingSeconds,
    label: `残り約 ${formatExportDuration(remainingSeconds)}`,
  }
}

import { ChapterBatchExportError } from './chapterBatchExport'
import { FontLoadError } from './googleFonts'

export function isExportAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}

export function formatExportError(err: unknown, context: 'single' | 'batch' = 'single'): ExportErrorPresentation {
  if (isExportAbortError(err)) {
    return {
      title: '書き出しをキャンセルしました',
      detail: '処理は中断されました。設定を変更して再試行できます。',
    }
  }

  const action = context === 'batch' ? '一括書き出し' : '書き出し'

  if (err instanceof ChapterBatchExportError) {
    return {
      title: `${action}に失敗しました`,
      detail: err.message,
    }
  }

  if (err instanceof FontLoadError) {
    return {
      title: `${action}に失敗しました`,
      detail: `${err.message}。インターネット接続を確認するか、別のフォントをお試しください。`,
    }
  }

  if (err instanceof Error) {
    return {
      title: `${action}に失敗しました`,
      detail: err.message,
    }
  }

  return {
    title: `${action}に失敗しました`,
    detail: '不明なエラーが発生しました。解像度・品質を下げて再試行してください。',
  }
}

export function formatExportProgressLabel(progress: number, etaLabel: string): string {
  const percent = Math.round(progress * 100)
  return `${percent}% 完了 · ${etaLabel}`
}
