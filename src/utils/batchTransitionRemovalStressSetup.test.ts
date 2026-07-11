import { describe, it, expect, beforeEach } from 'vitest'
import {
  getBatchTransitionRemovalStressStats,
  seedBatchTransitionRemovalStress,
} from './batchTransitionRemovalStressSetup'
import { useProjectStore } from '../store/projectStore'

describe('batchTransitionRemovalStressSetup', () => {
  beforeEach(() => {
    useProjectStore.getState().resetProject()
  })

  it('seedBatchTransitionRemovalStress は30件トランジション適用済みを投入する', () => {
    const stats = seedBatchTransitionRemovalStress()
    expect(stats.removalTargetCountAll).toBe(30)
    expect(stats.primaryRemovalCount).toBe(20)
    expect(stats.secondaryRemovalCount).toBe(10)
  })

  it('getBatchTransitionRemovalStressStats は適用後の削除対象件数を返す', () => {
    const stats = seedBatchTransitionRemovalStress()
    const recount = getBatchTransitionRemovalStressStats(useProjectStore.getState().project)
    expect(recount).toEqual({
      removalTargetCountAll: stats.removalTargetCountAll,
      primaryRemovalCount: stats.primaryRemovalCount,
      secondaryRemovalCount: stats.secondaryRemovalCount,
    })
  })
})
