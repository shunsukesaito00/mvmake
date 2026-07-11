import { RESOLUTION_PRESETS } from '../types/project'
import {
  getNativeExportButtonLabel,
  resolveExportSize,
} from './exportResolution'
import { useProjectStore } from '../store/projectStore'

export const EXPORT_720P_WIDTH = 1280
export const EXPORT_720P_HEIGHT = 720
export const EXPORT_RESOLUTION_ALIGNMENT_CASE_COUNT = 4
export const EXPORT_RESOLUTION_ALIGNMENT_STRESS_PRESET_ID = '4k'

export interface ResolutionAlignmentCase {
  presetId: string
  width: number
  height: number
  nativeLabel: string
}

export const EXPORT_RESOLUTION_ALIGNMENT_CASES: ResolutionAlignmentCase[] = [
  { presetId: '1080p', width: 1920, height: 1080, nativeLabel: '1080p で書き出し' },
  { presetId: '4k', width: 3840, height: 2160, nativeLabel: '4K で書き出し' },
  { presetId: 'square', width: 1080, height: 1080, nativeLabel: '1080×1080 で書き出し' },
  { presetId: 'vertical', width: 1080, height: 1920, nativeLabel: '9:16 で書き出し' },
]

export interface ExportResolutionAlignmentStressStats {
  caseCount: number
  activePresetId: string
  width: number
  height: number
  nativeExportLabel: string
  nativeExportWidth: number
  nativeExportHeight: number
  downscale720Width: number
  downscale720Height: number
  verifiedPresetIds: string[]
}

function findPresetById(presetId: string) {
  const preset = RESOLUTION_PRESETS.find((p) => p.id === presetId)
  if (!preset) throw new Error(`resolution preset missing: ${presetId}`)
  return preset
}

function buildAlignmentStats(width: number, height: number, presetId: string): ExportResolutionAlignmentStressStats {
  const native = resolveExportSize(width, height, 'project')
  const downscale = resolveExportSize(width, height, '720p')

  return {
    caseCount: EXPORT_RESOLUTION_ALIGNMENT_CASE_COUNT,
    activePresetId: presetId,
    width,
    height,
    nativeExportLabel: getNativeExportButtonLabel(width, height),
    nativeExportWidth: native.width,
    nativeExportHeight: native.height,
    downscale720Width: downscale.width,
    downscale720Height: downscale.height,
    verifiedPresetIds: [],
  }
}

/** 4形式すべてのネイティブ/720p 整合を検証し preset ID 一覧を返す */
export function verifyAllExportResolutionAlignmentCases(): string[] {
  for (const alignmentCase of EXPORT_RESOLUTION_ALIGNMENT_CASES) {
    const label = getNativeExportButtonLabel(alignmentCase.width, alignmentCase.height)
    if (label !== alignmentCase.nativeLabel) {
      throw new Error(`expected label ${alignmentCase.nativeLabel}, got ${label}`)
    }

    const native = resolveExportSize(alignmentCase.width, alignmentCase.height, 'project')
    if (native.width !== alignmentCase.width || native.height !== alignmentCase.height) {
      throw new Error(`native export mismatch for ${alignmentCase.presetId}`)
    }

    const downscale = resolveExportSize(alignmentCase.width, alignmentCase.height, '720p')
    if (downscale.width !== EXPORT_720P_WIDTH || downscale.height !== EXPORT_720P_HEIGHT) {
      throw new Error(`720p downscale mismatch for ${alignmentCase.presetId}`)
    }
  }

  return EXPORT_RESOLUTION_ALIGNMENT_CASES.map((c) => c.presetId)
}

export function getExportResolutionAlignmentStressStats(): ExportResolutionAlignmentStressStats {
  const project = useProjectStore.getState().project
  const preset = RESOLUTION_PRESETS.find((p) => p.width === project.width && p.height === project.height)
  return buildAlignmentStats(project.width, project.height, preset?.id ?? 'custom')
}

/** 解像度プリセットを適用して書き出し整合 stats を返す */
export function applyResolutionPresetById(presetId: string): ExportResolutionAlignmentStressStats {
  const preset = findPresetById(presetId)
  useProjectStore.getState().setProjectSettings({ width: preset.width, height: preset.height })
  return getExportResolutionAlignmentStressStats()
}

/** 4形式検証後に 4K プロジェクトへ切り替えたストレス状態を投入 */
export function seedExportResolutionAlignmentStress(): ExportResolutionAlignmentStressStats {
  useProjectStore.getState().resetProject()
  const verifiedPresetIds = verifyAllExportResolutionAlignmentCases()
  const stats = applyResolutionPresetById(EXPORT_RESOLUTION_ALIGNMENT_STRESS_PRESET_ID)

  if (stats.width !== 3840 || stats.height !== 2160) {
    throw new Error(`expected 4K project, got ${stats.width}×${stats.height}`)
  }
  if (stats.nativeExportLabel !== '4K で書き出し') {
    throw new Error(`expected 4K export label, got ${stats.nativeExportLabel}`)
  }
  if (stats.downscale720Width !== EXPORT_720P_WIDTH || stats.downscale720Height !== EXPORT_720P_HEIGHT) {
    throw new Error('4K project must downscale to 1280×720 for 720p export')
  }

  return { ...stats, verifiedPresetIds }
}
