import { describe, expect, it } from 'vitest'
import type { AdjustmentClip, Project } from '../types/project'
import { DEFAULT_COLOR } from '../types/project'
import {
  getAdjustmentColorForVisualTrack,
  isAdjustmentClip,
  mergeClipColorWithAdjustment,
  mergeColorAdjustments,
} from './colorAdjustments'

const adjustmentClip: AdjustmentClip = {
  id: 'adj1',
  type: 'adjustment',
  trackId: 't3',
  startTime: 0,
  duration: 10,
  sourceStart: 0,
  sourceDuration: 10,
  color: { brightness: 0.1, contrast: 0.05, saturation: 0.2 },
}

const project: Project = {
  id: 'p1',
  name: 'test',
  width: 1920,
  height: 1080,
  fps: 30,
  mediaAssets: [],
  tracks: [
    { id: 't1', name: '映像 1', type: 'video', clips: [] },
    { id: 't2', name: 'テキスト', type: 'text', clips: [] },
    { id: 't3', name: '調整', type: 'video', clips: [adjustmentClip] },
    { id: 't4', name: 'BGM', type: 'audio', clips: [] },
  ],
}

describe('mergeColorAdjustments', () => {
  it('色調を加算合成する', () => {
    const merged = mergeColorAdjustments(
      { brightness: 0.1, contrast: 0, saturation: 0 },
      { brightness: 0.05, contrast: 0.1, saturation: -0.2 },
    )
    expect(merged.brightness).toBeCloseTo(0.15)
    expect(merged.contrast).toBe(0.1)
    expect(merged.saturation).toBe(-0.2)
  })
})

describe('getAdjustmentColorForVisualTrack', () => {
  it('上位トラックの調整レイヤーを合成する', () => {
    const color = getAdjustmentColorForVisualTrack(project, 0, 5)
    expect(color).toEqual(adjustmentClip.color)
  })

  it('時間外なら中立色', () => {
    const color = getAdjustmentColorForVisualTrack(project, 0, 15)
    expect(color).toEqual(DEFAULT_COLOR)
  })

  it('同じまたは上位トラックの調整は含めない', () => {
    const color = getAdjustmentColorForVisualTrack(project, 2, 5)
    expect(color).toEqual(DEFAULT_COLOR)
  })
})

describe('mergeClipColorWithAdjustment', () => {
  it('クリップ色と調整を合成する', () => {
    const result = mergeClipColorWithAdjustment(
      { brightness: 0.05, contrast: 0, saturation: 0 },
      { brightness: 0.1, contrast: 0, saturation: 0 },
    )
    expect(result.brightness).toBeCloseTo(0.15)
  })
})

describe('isAdjustmentClip', () => {
  it('adjustment 型を判定する', () => {
    expect(isAdjustmentClip(adjustmentClip)).toBe(true)
  })
})
