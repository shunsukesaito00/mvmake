import { describe, it, expect } from 'vitest'
import { formatTime, snapTime, getProjectDuration } from './time'

describe('formatTime', () => {
  it('formats seconds with frames at 30fps', () => {
    expect(formatTime(65.5, 30)).toBe('01:05:15')
  })

  it('formats zero', () => {
    expect(formatTime(0, 30)).toBe('00:00:00')
  })
})

describe('snapTime', () => {
  it('snaps to nearby point within threshold', () => {
    expect(snapTime(1.1, [0, 1, 2], 0.15)).toBe(1)
  })

  it('returns original when no snap point nearby', () => {
    expect(snapTime(1.5, [0, 2], 0.1)).toBe(1.5)
  })
})

describe('getProjectDuration', () => {
  it('returns max clip end time', () => {
    const tracks = [
      { clips: [{ startTime: 0, duration: 5 }, { startTime: 10, duration: 3 }] },
      { clips: [{ startTime: 2, duration: 8 }] },
    ]
    expect(getProjectDuration(tracks)).toBe(13)
  })

  it('returns 0 for empty project', () => {
    expect(getProjectDuration([{ clips: [] }])).toBe(0)
  })
})
