import { describe, expect, it } from 'vitest'
import { resolveColorLookPreviewUrl, buildColorLookPreviewStyle } from './colorLookPreview'
import type { Project } from '../types/project'

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
        color: { brightness: 0, contrast: 0, saturation: 0, hue: 0, temperature: 0, tint: 0 },
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
      { brightness: 0, contrast: 0, saturation: 0, hue: 0, temperature: 0, tint: 0 },
      { fadeIn: 2, fadeOut: 0, clipDuration: 4, localTime: 1 },
    )
    expect(style.opacity).toBe(0.5)
  })
})
