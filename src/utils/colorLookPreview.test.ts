import { describe, expect, it } from 'vitest'
import {
  applyColorGradeToImageData,
  buildColorLookPreviewStyle,
  resolveColorLookPreviewUrl,
} from './colorLookPreview'
import type { Project } from '../types/project'
import { DEFAULT_COLOR } from '../types/project'

describe('colorLookPreview', () => {
  const project = {
    tracks: [{
      id: 'v1',
      type: 'video',
      name: 'Video',
      muted: false,
      locked: false,
      clips: [{
        id: 'clip1',
        type: 'image',
        trackId: 'v1',
        mediaId: 'img1',
        startTime: 0,
        duration: 5,
        sourceStart: 0,
        sourceDuration: 5,
        transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1 },
        color: { ...DEFAULT_COLOR },
        crop: { enabled: false, x: 0, y: 0, width: 1, height: 1 },
        kenBurns: { enabled: false, startScale: 1, endScale: 1, startX: 0.5, startY: 0.5, endX: 0.5, endY: 0.5 },
        fadeIn: 1,
        fadeOut: 0,
      }],
    }],
    mediaAssets: [{ id: 'img1', name: 'photo.png', type: 'image', url: 'blob:img', thumbnail: 'blob:thumb' }],
  } as unknown as Project

  it('resolveColorLookPreviewUrl が選択クリップのサムネイルを返す', () => {
    expect(resolveColorLookPreviewUrl(project, project.mediaAssets, 'clip1', 1)).toBe('blob:thumb')
  })

  it('buildColorLookPreviewStyle がフェード不透明度を反映する', () => {
    const style = buildColorLookPreviewStyle(
      { ...DEFAULT_COLOR },
      { fadeIn: 2, fadeOut: 0, clipDuration: 4, localTime: 1 },
    )
    expect(style.opacity).toBe(0.5)
  })

  it('applyColorGradeToImageData が色温度をピクセルに反映する', () => {
    const imageData = {
      data: new Uint8ClampedArray([128, 128, 128, 255]),
      width: 1,
      height: 1,
      colorSpace: 'srgb',
    } as ImageData
    applyColorGradeToImageData(imageData, { ...DEFAULT_COLOR, temperature: 0.3 })
    expect(imageData.data[0]).toBeGreaterThan(128)
    expect(imageData.data[2]).toBeLessThan(128)
  })

  it('applyColorGradeToImageData がトーンカーブをピクセルに反映する', () => {
    const imageData = {
      data: new Uint8ClampedArray([64, 64, 64, 255]),
      width: 1,
      height: 1,
      colorSpace: 'srgb',
    } as ImageData
    applyColorGradeToImageData(imageData, { ...DEFAULT_COLOR, midtones: 0.4 })
    expect(imageData.data[0]).toBeGreaterThan(64)
  })
})
