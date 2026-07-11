import { collectBatchTransitionRemovalClipIds } from './batchTransition'
import {
  createBatchTransitionStressProject,
  getBatchTransitionStressStats,
  seedBatchTransitionStress,
  type BatchTransitionStressStats,
} from './batchTransitionStressSetup'
import { useProjectStore } from '../store/projectStore'

const STRESS_TRANSITION = { type: 'crossfade' as const, duration: 0.5 }

export interface BatchTransitionRemovalStressStats extends BatchTransitionStressStats {
  removalTargetCountAll: number
  primaryRemovalCount: number
  secondaryRemovalCount: number
}

export function getBatchTransitionRemovalStressStats(
  project: ReturnType<typeof useProjectStore.getState>['project'],
): Pick<BatchTransitionRemovalStressStats, 'removalTargetCountAll' | 'primaryRemovalCount' | 'secondaryRemovalCount'> {
  const base = getBatchTransitionStressStats(project)
  return {
    removalTargetCountAll: collectBatchTransitionRemovalClipIds(project.tracks, 'all-video-tracks').length,
    primaryRemovalCount: collectBatchTransitionRemovalClipIds(
      project.tracks,
      'selected-track',
      base.primaryTrackId,
    ).length,
    secondaryRemovalCount: collectBatchTransitionRemovalClipIds(
      project.tracks,
      'selected-track',
      base.secondaryTrackId,
    ).length,
  }
}

/** 30 件トランジション適用済みのストレスプロジェクトを投入 */
export function seedBatchTransitionRemovalStress(): BatchTransitionRemovalStressStats {
  const stats = seedBatchTransitionStress()
  const applied = useProjectStore.getState().applyBatchTransitions('all-video-tracks', STRESS_TRANSITION)
  if (applied !== stats.allVideoTargetCount) {
    throw new Error(`expected ${stats.allVideoTargetCount} transitions applied, got ${applied}`)
  }
  const removal = getBatchTransitionRemovalStressStats(useProjectStore.getState().project)
  return { ...stats, ...removal }
}

export function createBatchTransitionRemovalStressProject() {
  const project = createBatchTransitionStressProject()
  return project
}
