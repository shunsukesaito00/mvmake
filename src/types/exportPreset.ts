import type { ExportQuality } from '../engine/exporter'

export type ExportResolution = '1080p' | '720p'

/** 書き出しダイアログで再利用する名前付き設定 */
export interface ExportPreset {
  id: string
  name: string
  quality: ExportQuality
  resolution: ExportResolution
  /** true のとき inPoint / outPoint を書き出し範囲に使う */
  useInOut: boolean
  inPoint: number | null
  outPoint: number | null
}

export const EXPORT_RESOLUTION_LABELS: Record<ExportResolution, string> = {
  '1080p': '1920×1080',
  '720p': '1280×720',
}
