import { describe, expect, it } from 'vitest'
import {
  buildColorPasteUpdates,
  clipColorSettingsEqual,
  clipSupportsColorPaste,
  extractClipColorSettings,
} from './colorPaste'
import { DEFAULT_COLOR, DEFAULT_LUT_INTENSITY, normalizeColorAdjustments } from '../types/project'
import { updateRgbCurvePoint } from './colorRgbCurve'
import type { ImageClip } from '../types/project'

function imageClip(overrides: Partial<ImageClip> = {}): ImageClip {
  return {
    id: 'c1',
    trackId: 't1',
    type: 'image',
    mediaId: 'm1',
    startTime: 0,
    duration: 4,
    sourceStart: 0,
    sourceDuration: 4,
    transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1 },
    kenBurns: { enabled: false, startScale: 1, endScale: 1, startX: 0.5, startY: 0.5, endX: 0.5, endY: 0.5 },
    color: { ...DEFAULT_COLOR },
    crop: { enabled: false, x: 0, y: 0, width: 1, height: 1 },
    fadeIn: 0,
    fadeOut: 0,
    ...overrides,
  }
}

describe('colorPaste', () => {
  it('clipSupportsColorPaste は映像系クリップのみ true', () => {
    expect(clipSupportsColorPaste(imageClip())).toBe(true)
    expect(clipSupportsColorPaste({ ...imageClip(), type: 'audio' } as never)).toBe(false)
  })

  it('extractClipColorSettings が LUT 設定を含めて抽出する', () => {
    const color = normalizeColorAdjustments({
      ...DEFAULT_COLOR,
      midtones: 0.25,
      rgbCurves: updateRgbCurvePoint(DEFAULT_COLOR.rgbCurves, 'r', 2, 0.7),
    })
    const settings = extractClipColorSettings(imageClip({
      color,
      lutId: 'lut-1',
      lutIntensity: 0.6,
    }))
    expect(settings.color.midtones).toBeCloseTo(0.25)
    expect(settings.lutId).toBe('lut-1')
    expect(settings.lutIntensity).toBe(0.6)
  })

  it('buildColorPasteUpdates がディープコピーを返す', () => {
    const source = extractClipColorSettings(imageClip({
      color: normalizeColorAdjustments({ ...DEFAULT_COLOR, midtones: 0.3 }),
      lutId: 'lut-2',
      lutIntensity: DEFAULT_LUT_INTENSITY,
    }))
    const updates = buildColorPasteUpdates(source)
    updates.color.midtones = 0
    expect(source.color.midtones).toBeCloseTo(0.3)
    expect(updates.lutId).toBe('lut-2')
  })

  it('clipColorSettingsEqual がルックと LUT を比較する', () => {
    const a = extractClipColorSettings(imageClip({
      color: normalizeColorAdjustments({ ...DEFAULT_COLOR, temperature: 0.2 }),
      lutId: 'lut-a',
    }))
    const b = extractClipColorSettings(imageClip({
      color: normalizeColorAdjustments({ ...DEFAULT_COLOR, temperature: 0.2 }),
      lutId: 'lut-a',
    }))
    const c = extractClipColorSettings(imageClip({
      color: normalizeColorAdjustments({ ...DEFAULT_COLOR, temperature: 0.1 }),
      lutId: 'lut-a',
    }))
    expect(clipColorSettingsEqual(a, b)).toBe(true)
    expect(clipColorSettingsEqual(a, c)).toBe(false)
  })
})
