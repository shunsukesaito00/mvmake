import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createDemoProject,
  DEMO_CHAPTER_MARKER_COUNT,
  DEMO_CLIP_DURATION,
  DEMO_IMAGE_COUNT,
  DEMO_PROJECT_NAME,
  getDemoProjectTimelineDuration,
} from './demoProject'

function stubCanvasElement() {
  const ctx = {
    createLinearGradient: () => ({ addColorStop: vi.fn() }),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
  }
  return {
    width: 0,
    height: 0,
    getContext: () => ctx,
    toBlob: (cb: (b: Blob | null) => void) => cb(new Blob(['jpeg'], { type: 'image/jpeg' })),
    toDataURL: () => 'data:image/jpeg;base64,abc',
  }
}

describe('demoProject', () => {
  beforeEach(() => {
    vi.stubGlobal('document', {
      createElement: (tag: string) => {
        if (tag === 'canvas') return stubCanvasElement()
        return {}
      },
    })
    vi.stubGlobal('URL', {
      createObjectURL: () => 'blob:demo',
    })
  })

  it('getDemoProjectTimelineDuration は画像枚数×尺を返す', () => {
    expect(getDemoProjectTimelineDuration(6, 5.5)).toBe(33)
  })

  it('createDemoProject は30秒超・BGM・章マーカー付きサンプルを生成する', async () => {
    const project = await createDemoProject()
    expect(project.name).toBe(DEMO_PROJECT_NAME)
    expect(getDemoProjectTimelineDuration(DEMO_IMAGE_COUNT, DEMO_CLIP_DURATION)).toBeGreaterThanOrEqual(30)

    const videoClips = project.tracks.find((t) => t.type === 'video')?.clips ?? []
    const textClips = project.tracks.find((t) => t.type === 'text')?.clips ?? []
    const audioClips = project.tracks.find((t) => t.type === 'audio')?.clips ?? []

    expect(videoClips).toHaveLength(DEMO_IMAGE_COUNT)
    expect(textClips.length).toBeGreaterThanOrEqual(3)
    expect(audioClips).toHaveLength(1)
    expect(project.mediaAssets.some((a) => a.type === 'audio')).toBe(true)
    expect(project.markers).toHaveLength(DEMO_CHAPTER_MARKER_COUNT)
    expect(project.markers?.every((m) => m.type === 'chapter')).toBe(true)
  })
})
