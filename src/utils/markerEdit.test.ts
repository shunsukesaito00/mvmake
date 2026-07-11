import { describe, it, expect } from 'vitest'
import {
  clampMarkerTime,
  normalizeMarkerUpdates,
  resolveMarkerDragTime,
  findMarkerById,
} from './markerEdit'
import type { TimelineMarker } from '../types/project'

describe('markerEdit', () => {
  const markers: TimelineMarker[] = [
    { id: 'm1', time: 0, label: 'A', type: 'chapter' },
    { id: 'm2', time: 20, label: 'B', type: 'chapter' },
  ]

  it('clampMarkerTime は 0〜プロジェクト尺に収める', () => {
    expect(clampMarkerTime(-5, 100)).toBe(0)
    expect(clampMarkerTime(50, 100)).toBe(50)
    expect(clampMarkerTime(150, 100)).toBe(100)
  })

  it('normalizeMarkerUpdates は時刻のみクランプする', () => {
    expect(normalizeMarkerUpdates({ label: 'X' }, 60)).toEqual({ label: 'X' })
    expect(normalizeMarkerUpdates({ time: -1 }, 60)).toEqual({ time: 0 })
    expect(normalizeMarkerUpdates({ time: 80, label: 'Y' }, 60)).toEqual({ time: 60, label: 'Y' })
  })

  it('resolveMarkerDragTime はクランプ後にスナップする', () => {
    expect(resolveMarkerDragTime(19.95, 120, [0, 20, 50])).toBe(20)
    expect(resolveMarkerDragTime(200, 120, [0, 20])).toBe(120)
    expect(resolveMarkerDragTime(19.9, 120, [0, 20, 120])).toBe(20)
  })

  it('findMarkerById', () => {
    expect(findMarkerById(markers, 'm2')?.label).toBe('B')
    expect(findMarkerById(markers, 'missing')).toBeUndefined()
  })
})
