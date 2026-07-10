import { describe, expect, it } from 'vitest'
import { createStressTestProject, getStressTestProjectStats, STRESS_TEST_SPEC } from '../engine/stressTestProject'
import { getDuckingIntervals, getAudioClipsFromProject } from './clipUtils'
import { getProjectDuration } from './time'
import { getCandidateVisualClipIndices } from './visualClipTimeline'
import { computeTimelineScrollLeftForTime } from './timelineZoom'

function measureMs(fn: () => void): number {
  const start = performance.now()
  fn()
  return performance.now() - start
}

describe('stress test project', () => {
  const project = createStressTestProject()
  const stats = getStressTestProjectStats(project)

  it('meets 10 min / ~100 clip target', () => {
    expect(stats.totalClips).toBe(100)
    expect(stats.imageClips).toBe(STRESS_TEST_SPEC.imageClipCount)
    expect(stats.textClips).toBe(STRESS_TEST_SPEC.textClipCount)
    expect(stats.audioClips).toBe(STRESS_TEST_SPEC.audioClipCount)
    expect(stats.durationSec).toBeGreaterThanOrEqual(STRESS_TEST_SPEC.targetDurationSec)
  })
})

describe('long-form performance benchmarks', () => {
  const project = createStressTestProject()
  const videoClips = project.tracks[0].clips.map((c) => ({
    startTime: c.startTime,
    duration: c.duration,
  }))

  it('getProjectDuration stays under 5ms', () => {
    const ms = measureMs(() => {
      for (let i = 0; i < 100; i++) getProjectDuration(project.tracks)
    })
    expect(ms).toBeLessThan(5)
  })

  it('getDuckingIntervals stays under 15ms for 100 clips', () => {
    const ms = measureMs(() => {
      for (let i = 0; i < 50; i++) getDuckingIntervals(project)
    })
    expect(ms).toBeLessThan(15)
  })

  it('getAudioClipsFromProject stays under 10ms', () => {
    const ms = measureMs(() => {
      for (let i = 0; i < 50; i++) getAudioClipsFromProject(project)
    })
    expect(ms).toBeLessThan(10)
  })

  it('candidate clip lookup stays under 20ms for 600 timeline samples', () => {
    const ms = measureMs(() => {
      for (let t = 0; t < 600; t += 1) {
        getCandidateVisualClipIndices(videoClips, t)
      }
    })
    expect(ms).toBeLessThan(20)
  })

  it('timeline scroll computation stays under 25ms', () => {
    const ms = measureMs(() => {
      for (let t = 0; t < 600; t += 2) {
        computeTimelineScrollLeftForTime(t, 40, 1200, 110)
      }
    })
    expect(ms).toBeLessThan(25)
  })
})
