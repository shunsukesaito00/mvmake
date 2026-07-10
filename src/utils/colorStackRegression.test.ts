import { describe, expect, it } from 'vitest'
import type { AdjustmentClip, Project } from '../types/project'
import { DEFAULT_COLOR } from '../types/project'
import {
  getAdjustmentColorForVisualTrack,
  mergeClipColorWithAdjustment,
} from './colorAdjustments'
import { COLOR_LOOK_PRESETS } from './colorLooks'
import { buildColorFilterCss } from './colorFilter'
import { parseCubeLut } from './cubeLut'
import {
  applyCompositorColorStackToImageData,
  needsCompositorPixelGrade,
} from './colorPixelGrade'
import { getAdjustmentLutForVisualTrack, resolveClipLut } from './lutResolve'

const WARM_CUBE_2 = `LUT_3D_SIZE 2
0 0 0
1 0.1 0
0 1 0
1 0.2 0
0 0 1
1 0.1 1
0 1 1
1 0.2 1
`

const weddingWarm = COLOR_LOOK_PRESETS.find((p) => p.id === 'wedding-warm')!.color

function makeImageData(r: number, g: number, b: number, a = 255): ImageData {
  return {
    data: new Uint8ClampedArray([r, g, b, a]),
    width: 1,
    height: 1,
    colorSpace: 'srgb',
  } as ImageData
}

function clonePixels(imageData: ImageData): Uint8ClampedArray {
  return new Uint8ClampedArray(imageData.data)
}

function assertPixelsFinite(imageData: ImageData): void {
  for (let i = 0; i < imageData.data.length; i++) {
    expect(Number.isFinite(imageData.data[i])).toBe(true)
    expect(imageData.data[i]).toBeGreaterThanOrEqual(0)
    expect(imageData.data[i]).toBeLessThanOrEqual(255)
  }
}

describe('composite color stack pipeline', () => {
  it('applies LUT then pixel grade in compositor order', () => {
    const parsed = parseCubeLut(WARM_CUBE_2)!
    const onlyLut = makeImageData(200, 80, 40)
    const lutBaseline = clonePixels(onlyLut.data)
    applyCompositorColorStackToImageData(onlyLut, DEFAULT_COLOR, { parsed, intensity: 1 })
    expect(onlyLut.data).not.toEqual(lutBaseline)

    const stacked = makeImageData(200, 80, 40)
    const effectiveColor = mergeClipColorWithAdjustment(
      { ...DEFAULT_COLOR, midtones: 0.15, temperature: 0.2 },
      DEFAULT_COLOR,
    )
    applyCompositorColorStackToImageData(stacked, effectiveColor, { parsed, intensity: 0.8 })
    expect(stacked.data[0]).toBeGreaterThan(onlyLut.data[0])
    assertPixelsFinite(stacked)
  })

  it('merges adjustment layer color with clip look before grading', () => {
    const adjustment: AdjustmentClip = {
      id: 'adj1',
      type: 'adjustment',
      trackId: 't3',
      startTime: 0,
      duration: 10,
      sourceStart: 0,
      sourceDuration: 10,
      color: { ...DEFAULT_COLOR, contrast: 0.1, temperature: 0.1 },
    }
    const project: Project = {
      id: 'p1',
      name: 'test',
      width: 1920,
      height: 1080,
      fps: 30,
      mediaAssets: [],
      tracks: [
        { id: 't1', name: '映像', type: 'video', clips: [], muted: false, locked: false },
        { id: 't2', name: 'テキスト', type: 'text', clips: [], muted: false, locked: false },
        { id: 't3', name: '調整', type: 'video', clips: [adjustment], muted: false, locked: false },
      ],
    }

    const adjustmentColor = getAdjustmentColorForVisualTrack(project, 0, 2)
    const effectiveColor = mergeClipColorWithAdjustment(weddingWarm, adjustmentColor)
    expect(effectiveColor.contrast).toBeCloseTo(0.18)
    expect(effectiveColor.temperature).toBeCloseTo(0.3)

    const imageData = makeImageData(128, 128, 128)
    applyCompositorColorStackToImageData(imageData, effectiveColor, null)
    const cssOnly = makeImageData(128, 128, 128)
    applyCompositorColorStackToImageData(cssOnly, weddingWarm, null)
    expect(imageData.data).not.toEqual(cssOnly.data)
  })

  it('uses clip LUT over adjustment LUT then grades merged color', () => {
    const adjustmentLut = getAdjustmentLutForVisualTrack({
      id: 'p1',
      name: 'test',
      width: 1920,
      height: 1080,
      fps: 30,
      mediaAssets: [],
      tracks: [
        { id: 't1', name: '映像', type: 'video', clips: [], muted: false, locked: false },
        { id: 't2', name: 'テキスト', type: 'text', clips: [], muted: false, locked: false },
        {
          id: 't3',
          name: '調整',
          type: 'video',
          clips: [{
            id: 'adj1',
            type: 'adjustment',
            trackId: 't3',
            startTime: 0,
            duration: 10,
            sourceStart: 0,
            sourceDuration: 10,
            color: DEFAULT_COLOR,
            lutId: 'lut-adj',
            lutIntensity: 0.5,
          }],
          muted: false,
          locked: false,
        },
      ],
    }, 0, 1)
    const clipLut = resolveClipLut(
      {
        id: 'v1',
        type: 'image',
        trackId: 't1',
        mediaId: 'm1',
        startTime: 0,
        duration: 5,
        sourceStart: 0,
        sourceDuration: 5,
        transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1 },
        kenBurns: { enabled: false, startScale: 1, endScale: 1, startX: 0.5, startY: 0.5, endX: 0.5, endY: 0.5 },
        color: weddingWarm,
        crop: { enabled: false, x: 0, y: 0, width: 1, height: 1 },
        fadeIn: 0,
        fadeOut: 0,
        lutId: 'lut-clip',
        lutIntensity: 1,
      },
      adjustmentLut,
    )
    expect(clipLut?.lutId).toBe('lut-clip')
    expect(needsCompositorPixelGrade(weddingWarm, { parsed: parseCubeLut(WARM_CUBE_2)!, intensity: 1 })).toBe(true)
  })
})

describe('extreme composite color values', () => {
  const extremeColor = {
    ...DEFAULT_COLOR,
    brightness: 1,
    contrast: 1,
    saturation: 1,
    hue: 1,
    temperature: 1,
    tint: 1,
    shadows: 1,
    midtones: 1,
    highlights: 1,
    rgbCurves: {
      r: [{ x: 0, y: 0 }, { x: 0.5, y: 0.8 }, { x: 1, y: 1 }],
      g: [{ x: 0, y: 0 }, { x: 0.5, y: 0.7 }, { x: 1, y: 1 }],
      b: [{ x: 0, y: 0 }, { x: 0.5, y: 0.6 }, { x: 1, y: 1 }],
    },
  }

  it('keeps pixels in range for LUT + full stack', () => {
    const parsed = parseCubeLut(WARM_CUBE_2)!
    const imageData = makeImageData(10, 128, 245)
    applyCompositorColorStackToImageData(imageData, extremeColor, { parsed, intensity: 1 })
    assertPixelsFinite(imageData)
    expect(buildColorFilterCss(extremeColor)).toContain('hue-rotate')
  })

  it('merges multiple adjustment layers additively', () => {
    const project: Project = {
      id: 'p1',
      name: 'test',
      width: 1920,
      height: 1080,
      fps: 30,
      mediaAssets: [],
      tracks: [
        { id: 't1', name: '映像', type: 'video', clips: [], muted: false, locked: false },
        { id: 't2', name: 'テキスト', type: 'text', clips: [], muted: false, locked: false },
        {
          id: 't3',
          name: '調整 A',
          type: 'video',
          clips: [{
            id: 'adj1',
            type: 'adjustment',
            trackId: 't3',
            startTime: 0,
            duration: 10,
            sourceStart: 0,
            sourceDuration: 10,
            color: { ...DEFAULT_COLOR, brightness: 0.05, temperature: 0.1 },
          }],
          muted: false,
          locked: false,
        },
        {
          id: 't4',
          name: '調整 B',
          type: 'video',
          clips: [{
            id: 'adj2',
            type: 'adjustment',
            trackId: 't4',
            startTime: 0,
            duration: 10,
            sourceStart: 0,
            sourceDuration: 10,
            color: { ...DEFAULT_COLOR, contrast: 0.08, tint: 0.05 },
          }],
          muted: false,
          locked: false,
        },
      ],
    }

    const merged = getAdjustmentColorForVisualTrack(project, 0, 2)
    expect(merged.brightness).toBeCloseTo(0.05)
    expect(merged.contrast).toBeCloseTo(0.08)
    expect(merged.temperature).toBeCloseTo(0.1)
    expect(merged.tint).toBeCloseTo(0.05)
  })
})
