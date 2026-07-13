import { TEXT_PRESETS } from '../types/project'
import { useProjectStore } from '../store/projectStore'
import { getProjectDuration } from './time'
import { estimateExportMemoryPressure } from './exportMemory'
import { seedExportResolutionAlignmentStress } from './exportResolutionAlignmentStressSetup'

export const EXPORT_MEMORY_WARNING_DURATION_SEC = 600

export interface ExportMemoryWarningStressStats {
  width: number
  height: number
  durationSec: number
  memoryLevel: 'caution' | 'high'
}

/** 4K 長尺プロジェクトを投入し、書き出しメモリ警告 UI を検証する */
export function seedExportMemoryWarningStress(): ExportMemoryWarningStressStats {
  seedExportResolutionAlignmentStress()

  const opening = TEXT_PRESETS.find((p) => p.id === 'opening')
  if (!opening) throw new Error('opening preset missing')

  useProjectStore.getState().addTextClip(opening, undefined, 0)

  const project = useProjectStore.getState().project
  const clip = project.tracks.find((t) => t.type === 'text')?.clips[0]
  if (!clip) throw new Error('text clip missing')

  useProjectStore.getState().updateClip(clip.id, { duration: EXPORT_MEMORY_WARNING_DURATION_SEC })

  const durationSec = getProjectDuration(useProjectStore.getState().project.tracks)
  const pressure = estimateExportMemoryPressure({
    width: project.width,
    height: project.height,
    durationSec,
    quality: 'standard',
  })

  if (pressure.level !== 'high') {
    throw new Error(`expected high memory pressure, got ${pressure.level}`)
  }

  return {
    width: project.width,
    height: project.height,
    durationSec,
    memoryLevel: 'high',
  }
}
