import type { ProjectSettingsPreset, ProjectSettingsSnapshot } from '../types/projectSettingsPreset'
import { createId } from './id'

export function buildProjectSettingsPreset(
  name: string,
  settings: ProjectSettingsSnapshot,
): ProjectSettingsPreset {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('プリセット名を入力してください')
  if (!Number.isFinite(settings.width) || !Number.isFinite(settings.height) || !Number.isFinite(settings.fps)) {
    throw new Error('解像度または FPS の値が不正です')
  }

  return {
    id: createId(),
    name: trimmed,
    width: settings.width,
    height: settings.height,
    fps: settings.fps,
    rippleDelete: settings.rippleDelete,
    loopPlayback: settings.loopPlayback,
  }
}

export function snapshotFromProjectSettingsPreset(preset: ProjectSettingsPreset): ProjectSettingsSnapshot {
  return {
    width: preset.width,
    height: preset.height,
    fps: preset.fps,
    rippleDelete: preset.rippleDelete,
    loopPlayback: preset.loopPlayback,
  }
}

export function formatProjectSettingsPresetSummary(preset: ProjectSettingsPreset): string {
  const ripple = preset.rippleDelete ? 'リップルON' : 'リップルOFF'
  const loop = preset.loopPlayback ? 'ループON' : 'ループOFF'
  return `${preset.width}×${preset.height} · ${preset.fps}fps · ${ripple} · ${loop}`
}
