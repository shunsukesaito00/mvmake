import { describe, expect, it } from 'vitest'
import { beatMarkerLabel, countBeatMarkers, filterChapterMarkers, generateBeatMarkerTimes, isChapterMarker } from './beatMarkers'
import type { TimelineMarker } from '../types/project'

describe('beatMarkers', () => {
  const markers: TimelineMarker[] = [
    { id: 'c1', time: 0, label: 'Opening', type: 'chapter' },
    { id: 'b1', time: 1, label: 'Beat 1', type: 'beat' },
    { id: 'b2', time: 2, label: 'Beat 2', type: 'beat' },
  ]

  it('identifies chapter markers', () => {
    expect(isChapterMarker(markers[0])).toBe(true)
    expect(isChapterMarker(markers[1])).toBe(false)
    expect(filterChapterMarkers(markers)).toHaveLength(1)
  })

  it('counts beat markers', () => {
    expect(countBeatMarkers(markers)).toBe(2)
  })

  it('generates beat times with interval', () => {
    expect(generateBeatMarkerTimes(0, 2.5, 1)).toEqual([0, 1, 2])
    expect(generateBeatMarkerTimes(1, 1, 0.5)).toEqual([])
  })

  it('formats beat labels', () => {
    expect(beatMarkerLabel(3)).toBe('Beat 3')
  })
})
