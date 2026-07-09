/** localStorage に保存するプロジェクト設定プリセット */
export interface ProjectSettingsPreset {
  id: string
  name: string
  width: number
  height: number
  fps: number
  rippleDelete: boolean
  loopPlayback: boolean
}

export interface ProjectSettingsSnapshot {
  width: number
  height: number
  fps: number
  rippleDelete: boolean
  loopPlayback: boolean
}
