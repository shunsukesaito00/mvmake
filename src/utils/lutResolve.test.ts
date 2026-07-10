import { describe, expect, it } from 'vitest'
import type { AdjustmentClip, ImageClip, Project, VideoClip } from '../types/project'
import { DEFAULT_AUDIO, DEFAULT_COLOR, DEFAULT_CROP, DEFAULT_TRANSFORM, DEFAULT_VISUAL_FADE } from '../types/project'
import { getAdjustmentLutForVisualTrack, resolveClipLut } from './lutResolve'

const videoClip: VideoClip = {
  id: 'v1',
  type: 'video',
  trackId: 't1',
  mediaId: 'm1',
  startTime: 0,
  duration: 5,
  sourceStart: 0,
  sourceDuration: 5,
  transform: { ...DEFAULT_TRANSFORM },
  audio: { ...DEFAULT_AUDIO },
  speed: 1,
  color: { ...DEFAULT_COLOR },
  crop: { ...DEFAULT_CROP },
  ...DEFAULT_VISUAL_FADE,
}

const adjustment: AdjustmentClip = {
  id: 'adj1',
  type: 'adjustment',
  trackId: 't3',
  startTime: 0,
  duration: 10,
  sourceStart: 0,
  sourceDuration: 10,
  color: { ...DEFAULT_COLOR },
  lutId: 'lut-adj',
  lutIntensity: 0.6,
}

const project: Project = {
  id: 'p1',
  name: 'test',
  width: 1920,
  height: 1080,
  fps: 30,
  mediaAssets: [],
  lutAssets: [],
  tracks: [
    { id: 't1', name: '映像', type: 'video', clips: [videoClip], muted: false, locked: false },
    { id: 't2', name: 'テキスト', type: 'text', clips: [], muted: false, locked: false },
    { id: 't3', name: '調整', type: 'video', clips: [adjustment], muted: false, locked: false },
  ],
}

describe('getAdjustmentLutForVisualTrack', () => {
  it('returns LUT from adjustment layer above visual track', () => {
    const lut = getAdjustmentLutForVisualTrack(project, 0, 1)
    expect(lut).toEqual({ lutId: 'lut-adj', intensity: 0.6 })
  })

  it('returns topmost adjustment LUT when multiple layers overlap', () => {
    const multi: Project = {
      ...project,
      tracks: [
        project.tracks[0],
        project.tracks[1],
        {
          id: 't3',
          name: '調整下',
          type: 'video',
          clips: [{ ...adjustment, id: 'adj-low', lutId: 'lut-low', lutIntensity: 0.3 }],
          muted: false,
          locked: false,
        },
        {
          id: 't4',
          name: '調整上',
          type: 'video',
          clips: [{ ...adjustment, id: 'adj-high', lutId: 'lut-high', lutIntensity: 0.9 }],
          muted: false,
          locked: false,
        },
      ],
    }
    const lut = getAdjustmentLutForVisualTrack(multi, 0, 1)
    expect(lut).toEqual({ lutId: 'lut-high', intensity: 0.9 })
  })
})

describe('resolveClipLut', () => {
  it('prefers clip LUT over adjustment LUT', () => {
    const clip: ImageClip = { ...videoClip, type: 'image', kenBurns: { enabled: false, startScale: 1, endScale: 1, startX: 0.5, startY: 0.5, endX: 0.5, endY: 0.5 }, lutId: 'lut-clip' }
    const resolved = resolveClipLut(clip, { lutId: 'lut-adj', intensity: 0.5 })
    expect(resolved?.lutId).toBe('lut-clip')
  })

  it('falls back to adjustment LUT', () => {
    const resolved = resolveClipLut(videoClip, { lutId: 'lut-adj', intensity: 0.5 })
    expect(resolved).toEqual({ lutId: 'lut-adj', intensity: 0.5 })
  })
})
