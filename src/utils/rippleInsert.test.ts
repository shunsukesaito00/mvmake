import { describe, expect, it } from 'vitest'
import type { VideoClip } from '../types/project'
import { DEFAULT_AUDIO, DEFAULT_COLOR, DEFAULT_CROP, DEFAULT_TRANSFORM, DEFAULT_VISUAL_FADE } from '../types/project'
import { canRippleInsertAt, isRippleInsertActive, prepareTrackClipsForInsert } from './rippleInsert'

function videoClip(id: string, startTime: number, duration: number): VideoClip {
  return {
    id,
    trackId: 't1',
    type: 'video',
    mediaId: 'm1',
    startTime,
    duration,
    sourceStart: 0,
    sourceDuration: duration,
    transform: { ...DEFAULT_TRANSFORM },
    audio: { ...DEFAULT_AUDIO },
    speed: 1,
    color: { ...DEFAULT_COLOR },
    crop: { ...DEFAULT_CROP },
    ...DEFAULT_VISUAL_FADE,
  }
}

describe('rippleInsert', () => {
  const existing = [videoClip('a', 0, 5), videoClip('b', 8, 5)]

  it('canRippleInsertAt rejects times inside a clip', () => {
    expect(canRippleInsertAt(existing, 2)).toBe(false)
    expect(canRippleInsertAt(existing, 5)).toBe(true)
    expect(canRippleInsertAt(existing, 7)).toBe(true)
  })

  it('prepareTrackClipsForInsert shifts subsequent clips when ripple insert is on', () => {
    const inserted = videoClip('new', 5, 4)
    const result = prepareTrackClipsForInsert(existing, inserted, 5, true)
    expect(result.find((c) => c.id === 'new')?.startTime).toBe(5)
    expect(result.find((c) => c.id === 'b')?.startTime).toBe(12)
  })

  it('prepareTrackClipsForInsert resolves overlap when ripple insert is off', () => {
    const inserted = videoClip('new', 5, 4)
    const result = prepareTrackClipsForInsert(existing, inserted, 5, false)
    expect(result.find((c) => c.id === 'new')?.startTime).toBeGreaterThan(8)
    expect(result.find((c) => c.id === 'b')?.startTime).toBe(8)
  })

  it('isRippleInsertActive is true when magnetic timeline is on', () => {
    expect(isRippleInsertActive(true, false)).toBe(true)
    expect(isRippleInsertActive(false, true)).toBe(true)
    expect(isRippleInsertActive(false, false)).toBe(false)
  })
})
