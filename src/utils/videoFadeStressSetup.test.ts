import { describe, it, expect, beforeEach } from 'vitest'
import {
  VIDEO_FADE_STRESS_CLIP_COUNT,
  VIDEO_FADE_STRESS_IMAGE_FADE_IN,
  VIDEO_FADE_STRESS_IMAGE_FADE_OUT,
  VIDEO_FADE_STRESS_VIDEO_DURATION,
  VIDEO_FADE_STRESS_VIDEO_FADE_IN,
  VIDEO_FADE_STRESS_VIDEO_FADE_OUT,
  applyClipFade,
  getClipFadeValues,
  getMediaVisualOpacityForClip,
  seedVideoFadeStress,
} from './videoFadeStressSetup'
import { DEFAULT_VISUAL_FADE } from '../types/project'
import { useProjectStore } from '../store/projectStore'

describe('videoFadeStressSetup', () => {
  beforeEach(() => {
    useProjectStore.getState().resetProject()
  })

  it('seedVideoFadeStress は2クリップと開始/終端不透明度を配置する', () => {
    const stats = seedVideoFadeStress()
    expect(stats.clipCount).toBe(VIDEO_FADE_STRESS_CLIP_COUNT)
    expect(stats.imageFadeIn).toBe(VIDEO_FADE_STRESS_IMAGE_FADE_IN)
    expect(stats.imageFadeOut).toBe(VIDEO_FADE_STRESS_IMAGE_FADE_OUT)
    expect(stats.videoFadeIn).toBe(VIDEO_FADE_STRESS_VIDEO_FADE_IN)
    expect(stats.videoFadeOut).toBe(VIDEO_FADE_STRESS_VIDEO_FADE_OUT)
    expect(stats.imageOpacityAtStart).toBe(0)
    expect(stats.imageOpacityAtMid).toBeCloseTo(0.5)
    expect(stats.videoOpacityAtEnd).toBe(0)
  })

  it('フェード変更を undo で復元できる', () => {
    const stats = seedVideoFadeStress()
    applyClipFade(stats.imageClipId, 0.2, 0.2)
    expect(getClipFadeValues(stats.imageClipId).fadeIn).toBe(0.2)

    useProjectStore.getState().undo()
    expect(getClipFadeValues(stats.imageClipId).fadeIn).toBe(VIDEO_FADE_STRESS_IMAGE_FADE_IN)
    expect(getClipFadeValues(stats.imageClipId).fadeOut).toBe(VIDEO_FADE_STRESS_IMAGE_FADE_OUT)
    expect(getMediaVisualOpacityForClip(stats.imageClipId, 0)).toBe(0)
  })

  it('undo 後の再適用でフェードと不透明度が復元される', () => {
    const stats = seedVideoFadeStress()
    applyClipFade(stats.videoClipId, 0, 0)
    useProjectStore.getState().undo()
    const applied = applyClipFade(stats.videoClipId, VIDEO_FADE_STRESS_VIDEO_FADE_IN, VIDEO_FADE_STRESS_VIDEO_FADE_OUT)
    expect(applied.fadeIn).toBe(VIDEO_FADE_STRESS_VIDEO_FADE_IN)
    expect(applied.fadeOut).toBe(VIDEO_FADE_STRESS_VIDEO_FADE_OUT)
    expect(getMediaVisualOpacityForClip(stats.videoClipId, VIDEO_FADE_STRESS_VIDEO_DURATION)).toBe(0)
    expect(getMediaVisualOpacityForClip(stats.videoClipId, 0)).toBe(0)
    expect(getMediaVisualOpacityForClip(stats.videoClipId, VIDEO_FADE_STRESS_VIDEO_FADE_IN)).toBeCloseTo(1)
  })

  it('フェードなしは不透明度1を維持する', () => {
    const stats = seedVideoFadeStress()
    applyClipFade(stats.imageClipId, DEFAULT_VISUAL_FADE.fadeIn, DEFAULT_VISUAL_FADE.fadeOut)
    expect(getMediaVisualOpacityForClip(stats.imageClipId, 0)).toBe(1)
  })
})
