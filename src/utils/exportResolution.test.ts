import { describe, expect, it } from 'vitest'
import {
  getNativeExportButtonLabel,
  normalizeExportResolution,
  resolveExportSize,
  scaleVideoBitrate,
} from './exportResolution'

describe('exportResolution', () => {
  it('720p は固定サイズにダウンスケール', () => {
    expect(resolveExportSize(3840, 2160, '720p')).toEqual({ width: 1280, height: 720 })
    expect(resolveExportSize(1080, 1080, '720p')).toEqual({ width: 1280, height: 720 })
  })

  it('project はプロジェクト解像度をそのまま使う', () => {
    expect(resolveExportSize(3840, 2160, 'project')).toEqual({ width: 3840, height: 2160 })
    expect(resolveExportSize(1080, 1080, 'project')).toEqual({ width: 1080, height: 1080 })
  })

  it('4K 向けにビットレートをスケール', () => {
    expect(scaleVideoBitrate(8_000_000, 3840, 2160)).toBeGreaterThan(8_000_000)
    expect(scaleVideoBitrate(8_000_000, 1280, 720)).toBeLessThan(8_000_000)
  })

  it('1080p プロジェクトは従来ラベルを維持', () => {
    expect(getNativeExportButtonLabel(1920, 1080)).toBe('1080p で書き出し')
  })

  it('正方形・4K・縦型のラベルを返す', () => {
    expect(getNativeExportButtonLabel(1080, 1080)).toBe('1080×1080 で書き出し')
    expect(getNativeExportButtonLabel(3840, 2160)).toBe('4K で書き出し')
    expect(getNativeExportButtonLabel(1080, 1920)).toBe('9:16 で書き出し')
  })

  it('縦型プロジェクトはネイティブ解像度で書き出す', () => {
    expect(resolveExportSize(1080, 1920, 'project')).toEqual({ width: 1080, height: 1920 })
  })

  it('旧 1080p プリセット値を project に正規化', () => {
    expect(normalizeExportResolution('1080p')).toBe('project')
    expect(normalizeExportResolution('720p')).toBe('720p')
  })
})
