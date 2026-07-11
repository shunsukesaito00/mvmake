import {
  loadProjectSettingsPresets,
  replaceProjectSettingsPresets,
} from '../persistence/projectSettingsPresets'
import { buildProjectSettingsPreset } from './projectSettingsPresetUtils'
import type { ProjectSettingsSnapshot } from '../types/projectSettingsPreset'

/** E2E/ストレス用の婚礼フォーマットプリセット件数 */
export const PROJECT_SETTINGS_PRESET_STRESS_COUNT = 6

const STRESS_PRESET_DEFINITIONS: Array<{ name: string } & ProjectSettingsSnapshot> = [
  { name: '横型婚礼', width: 1920, height: 1080, fps: 30, rippleDelete: true, loopPlayback: false },
  { name: '縦型婚礼', width: 1080, height: 1920, fps: 24, rippleDelete: true, loopPlayback: true },
  { name: '正方形SNS', width: 1080, height: 1080, fps: 30, rippleDelete: false, loopPlayback: false },
  { name: '4K横型', width: 3840, height: 2160, fps: 60, rippleDelete: true, loopPlayback: false },
  { name: '720p軽量', width: 1280, height: 720, fps: 24, rippleDelete: false, loopPlayback: true },
  { name: 'シネマ2.39', width: 1920, height: 804, fps: 24, rippleDelete: true, loopPlayback: true },
]

export interface ProjectSettingsPresetStressStats {
  presetCount: number
  names: string[]
  verticalPresetName: string
  verticalWidth: number
  verticalHeight: number
  verticalFps: number
}

export function clearProjectSettingsPresetStress(): void {
  replaceProjectSettingsPresets([])
}

/** 婚礼向け6形式の設定プリセットを localStorage に投入 */
export function seedProjectSettingsPresetStress(): ProjectSettingsPresetStressStats {
  const presets = STRESS_PRESET_DEFINITIONS.map((def) =>
    buildProjectSettingsPreset(def.name, {
      width: def.width,
      height: def.height,
      fps: def.fps,
      rippleDelete: def.rippleDelete,
      loopPlayback: def.loopPlayback,
    }),
  )
  replaceProjectSettingsPresets(presets)

  const vertical = STRESS_PRESET_DEFINITIONS.find((d) => d.name === '縦型婚礼')!
  return {
    presetCount: presets.length,
    names: presets.map((p) => p.name),
    verticalPresetName: vertical.name,
    verticalWidth: vertical.width,
    verticalHeight: vertical.height,
    verticalFps: vertical.fps,
  }
}

export function getProjectSettingsPresetStressCount(): number {
  return loadProjectSettingsPresets().length
}
