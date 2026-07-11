import { describe, it, expect, beforeEach } from 'vitest'
import {
  TONE_CURVE_STRESS_MIDTONES,
  TONE_CURVE_STRESS_PIXEL_GRAY,
  TONE_CURVE_STRESS_RGB_POINT_INDEX,
  TONE_CURVE_STRESS_RGB_R_MID,
  applyClipColor,
  applyClipRgbCurvePoint,
  buildStressColor,
  createToneCurveStressProject,
  getClipColor,
  getClipPixelGradeSample,
  getRgbCurveSampleAt,
  getToneCurveStressStats,
  samplePixelGrade,
  seedToneCurveStress,
} from './toneCurveStressSetup'
import { DEFAULT_COLOR } from '../types/project'
import { sampleRgbCurve } from './colorRgbCurve'
import { useProjectStore } from '../store/projectStore'

describe('toneCurveStressSetup', () => {
  beforeEach(() => {
    useProjectStore.getState().resetProject()
  })

  it('createToneCurveStressProject はトーン・RGBカーブ付き画像クリップを生成する', () => {
    const project = createToneCurveStressProject()
    const stats = getToneCurveStressStats(project)
    expect(stats.toneCurveActive).toBe(true)
    expect(stats.rgbCurvesActive).toBe(true)
    expect(stats.midtones).toBe(TONE_CURVE_STRESS_MIDTONES)
    expect(stats.rgbRMidOutput).toBeCloseTo(TONE_CURVE_STRESS_RGB_R_MID, 3)
  })

  it('PCHIP 補間で中間輝度がストレス値と一致する', () => {
    const color = buildStressColor()
    expect(sampleRgbCurve(color.rgbCurves.r, 0.5)).toBeCloseTo(TONE_CURVE_STRESS_RGB_R_MID, 3)
  })

  it('トーンカーブで中間グレーのピクセルが持ち上がる', () => {
    const stressed = samplePixelGrade(buildStressColor())
    const neutral = samplePixelGrade(DEFAULT_COLOR)
    expect(stressed.r).toBeGreaterThan(neutral.r)
    expect(stressed.g).toBeGreaterThan(neutral.g)
    expect(stressed.b).toBeGreaterThan(neutral.b)
  })

  it('RGB R チャンネル変更がピクセル赤成分に反映される', () => {
    const stats = seedToneCurveStress()
    const before = getClipPixelGradeSample(stats.clipId)
    applyClipRgbCurvePoint(stats.clipId, 'r', TONE_CURVE_STRESS_RGB_POINT_INDEX, 0.8, true)
    const after = getClipPixelGradeSample(stats.clipId)
    expect(after.r).toBeGreaterThan(before.r)
    expect(after.g).toBe(before.g)
    expect(getRgbCurveSampleAt(stats.clipId, 'r', 0.5)).toBeCloseTo(0.8, 2)
  })

  it('色調変更を undo で復元できる', () => {
    const stats = seedToneCurveStress()
    const before = getClipColor(stats.clipId)
    applyClipColor(stats.clipId, { midtones: 0.45 }, true)
    expect(getClipColor(stats.clipId).midtones).toBe(0.45)

    useProjectStore.getState().undo()
    expect(getClipColor(stats.clipId).midtones).toBeCloseTo(before.midtones, 5)
    expect(getClipPixelGradeSample(stats.clipId).r).toBeCloseTo(
      samplePixelGrade(before, TONE_CURVE_STRESS_PIXEL_GRAY).r,
      0,
    )
  })
})
