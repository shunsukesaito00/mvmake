import { describe, expect, it } from 'vitest'
import { findForegroundVideoClipAtTime } from './compositor'
import { DEFAULT_AUDIO, DEFAULT_COLOR, DEFAULT_CROP, DEFAULT_TRANSFORM, DEFAULT_VISUAL_FADE, type Project, type VideoClip } from '../types/project'

function videoClip(id: string, trackId: string, startTime: number): VideoClip {
  return {
    id,
    trackId,
    type: 'video',
    mediaId: `media-${id}`,
    startTime,
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
}

function projectWithTracks(clipsByTrack: Record<string, VideoClip[]>): Project {
  return {
    id: 'p1',
    name: 'test',
    width: 1920,
    height: 1080,
    fps: 30,
    mediaAssets: [],
    markers: [],
    tracks: [
      { id: 'track-bottom', name: '映像 1', type: 'video', clips: clipsByTrack.bottom ?? [], muted: false, locked: false },
      { id: 'track-top', name: '映像 2', type: 'video', clips: clipsByTrack.top ?? [], muted: false, locked: false },
      { id: 'track-text', name: 'テキスト', type: 'text', clips: [], muted: false, locked: false },
    ],
  }
}

describe('findForegroundVideoClipAtTime', () => {
  it('上のトラックのビデオクリップを返す', () => {
    const project = projectWithTracks({
      bottom: [videoClip('bottom', 'track-bottom', 0)],
      top: [videoClip('top', 'track-top', 0)],
    })

    expect(findForegroundVideoClipAtTime(project, 1)?.id).toBe('top')
  })

  it('アクティブでないクリップは無視する', () => {
    const project = projectWithTracks({
      bottom: [videoClip('bottom', 'track-bottom', 0)],
      top: [videoClip('top', 'track-top', 10)],
    })

    expect(findForegroundVideoClipAtTime(project, 1)?.id).toBe('bottom')
  })
})
