import { describe, it, expect, beforeEach } from 'vitest'
import {
  BATCH_TRANSITION_STRESS_PRIMARY_CLIPS,
  BATCH_TRANSITION_STRESS_SECONDARY_CLIPS,
  createBatchTransitionStressProject,
  getBatchTransitionStressStats,
  seedBatchTransitionStress,
} from './batchTransitionStressSetup'
import { collectBatchTransitionClipIds } from './batchTransition'
import { useProjectStore } from '../store/projectStore'

describe('batchTransitionStressSetup', () => {
  beforeEach(() => {
    useProjectStore.getState().resetProject()
  })

  it('createBatchTransitionStressProject は2映像トラックに隣接クリップ列を配置する', () => {
    const project = createBatchTransitionStressProject()
    const stats = getBatchTransitionStressStats(project)
    expect(stats.primaryClipCount).toBe(BATCH_TRANSITION_STRESS_PRIMARY_CLIPS)
    expect(stats.secondaryClipCount).toBe(BATCH_TRANSITION_STRESS_SECONDARY_CLIPS)
    expect(stats.allVideoTargetCount).toBe(
      BATCH_TRANSITION_STRESS_PRIMARY_CLIPS - 1 + BATCH_TRANSITION_STRESS_SECONDARY_CLIPS - 1,
    )
  })

  it('seedBatchTransitionStress でストアへ投入する', () => {
    const stats = seedBatchTransitionStress()
    expect(stats.allVideoTargetCount).toBe(30)
    expect(useProjectStore.getState().project.tracks.filter((t) => t.type === 'video')).toHaveLength(2)
  })

  it('副トラックのみ selected-track スコープで絞れる', () => {
    const project = createBatchTransitionStressProject()
    const stats = getBatchTransitionStressStats(project)
    const ids = collectBatchTransitionClipIds(
      project.tracks,
      'selected-track',
      stats.secondaryTrackId,
    )
    expect(ids).toHaveLength(stats.secondaryOnlyTargetCount)
    expect(ids).toHaveLength(BATCH_TRANSITION_STRESS_SECONDARY_CLIPS - 1)
  })
})
