export interface DuckingSchedule {
  intervals: Array<{ start: number; end: number }>
  amount: number
  fade: number
}

/**
 * ダッキング用ゲインノードに音量オートメーションを設定する。
 * toContextTime はプロジェクト時間 → AudioContext 時間の変換。
 */
export function applyDucking(
  gainParam: GainNode['gain'],
  ducking: DuckingSchedule,
  clipStart: number,
  clipEnd: number,
  playbackStart: number,
  toContextTime: (projectTime: number) => number,
): void {
  gainParam.value = 1
  for (const iv of ducking.intervals) {
    const s = Math.max(iv.start, clipStart, playbackStart)
    const e = Math.min(iv.end, clipEnd)
    if (e <= s) continue

    if (s <= playbackStart + 0.01) {
      gainParam.setValueAtTime(ducking.amount, toContextTime(playbackStart))
    } else {
      gainParam.setValueAtTime(1, toContextTime(s))
      gainParam.linearRampToValueAtTime(ducking.amount, toContextTime(s) + ducking.fade)
    }
    gainParam.setValueAtTime(ducking.amount, toContextTime(e))
    gainParam.linearRampToValueAtTime(1, toContextTime(e) + ducking.fade)
  }
}
