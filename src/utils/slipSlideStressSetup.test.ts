import { describe, it, expect, beforeEach } from 'vitest'
import {
  SLIP_SLIDE_STRESS_CLIP_COUNT,
  SLIP_SLIDE_STRESS_SLIDE_DELTA,
  SLIP_SLIDE_STRESS_SLIP_DELTA,
  createSlipSlideStressProject,
  getClipDuration,
  getClipSourceStart,
  getClipStartTime,
  getClipTransformKeyframeTimes,
  getClipVolumeKeyframeTimes,
  getSlipSlideStressStats,
  seedSlipSlideStress,
  slideClipById,
  slipClipById,
} from './slipSlideStressSetup'
import { useProjectStore } from '../store/projectStore'

describe('slipSlideStressSetup', () => {
  beforeEach(() => {
    useProjectStore.getState().resetProject()
  })

  it('createSlipSlideStressProject は隣接3クリップと中央KFを生成する', () => {
    const project = createSlipSlideStressProject()
    const stats = getSlipSlideStressStats(project)
    expect(stats.clipCount).toBe(SLIP_SLIDE_STRESS_CLIP_COUNT)
    expect(stats.transformKeyframeCount).toBe(2)
    expect(stats.volumeKeyframeCount).toBe(2)
  })

  it('スリップで sourceStart が変化し KF 時刻は維持される', () => {
    const stats = seedSlipSlideStress()
    const transformBefore = getClipTransformKeyframeTimes(stats.selectedClipId)
    const volumeBefore = getClipVolumeKeyframeTimes(stats.selectedClipId)

    expect(slipClipById(stats.selectedClipId, SLIP_SLIDE_STRESS_SLIP_DELTA)).toBe(true)
    expect(getClipSourceStart(stats.selectedClipId)).toBe(stats.sourceStartAfterSlip)
    expect(getClipStartTime(stats.selectedClipId)).toBe(stats.selectedStartBefore)
    expect(getClipTransformKeyframeTimes(stats.selectedClipId)).toEqual(transformBefore)
    expect(getClipVolumeKeyframeTimes(stats.selectedClipId)).toEqual(volumeBefore)
  })

  it('スライドで隣接クリップが連動し中央 KF は維持される', () => {
    const stats = seedSlipSlideStress()
    const transformBefore = getClipTransformKeyframeTimes(stats.selectedClipId)
    const volumeBefore = getClipVolumeKeyframeTimes(stats.selectedClipId)

    expect(slideClipById(stats.selectedClipId, SLIP_SLIDE_STRESS_SLIDE_DELTA)).toBe(true)
    expect(getClipStartTime(stats.selectedClipId)).toBeCloseTo(stats.selectedStartAfterSlide, 5)
    expect(getClipDuration(stats.prevClipId)).toBeCloseTo(stats.prevDurationAfterSlide, 5)
    expect(getClipTransformKeyframeTimes(stats.selectedClipId)).toEqual(transformBefore)
    expect(getClipVolumeKeyframeTimes(stats.selectedClipId)).toEqual(volumeBefore)
  })

  it('スリップを undo で復元できる', () => {
    const stats = seedSlipSlideStress()
    const before = getClipSourceStart(stats.selectedClipId)
    slipClipById(stats.selectedClipId, SLIP_SLIDE_STRESS_SLIP_DELTA)

    useProjectStore.getState().undo()
    expect(getClipSourceStart(stats.selectedClipId)).toBe(before)
  })

  it('スライドを undo で復元できる', () => {
    const stats = seedSlipSlideStress()
    const beforeStart = getClipStartTime(stats.selectedClipId)
    const beforePrevDuration = getClipDuration(stats.prevClipId)
    slideClipById(stats.selectedClipId, SLIP_SLIDE_STRESS_SLIDE_DELTA)

    useProjectStore.getState().undo()
    expect(getClipStartTime(stats.selectedClipId)).toBeCloseTo(beforeStart, 5)
    expect(getClipDuration(stats.prevClipId)).toBeCloseTo(beforePrevDuration, 5)
  })
})
