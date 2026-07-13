import { isReverseShuttleRate, type PlaybackShuttleRate } from './playbackShuttle'

export type PlaybackMasterClockMode = 'audio' | 'wall' | 'idle'

/** 壁時計とマスタークロックの許容ドリフト（秒） */
export const PLAYBACK_DRIFT_CORRECTION_THRESHOLD_SEC = 0.05

/** ドリフト補正の最小間隔 */
export const PLAYBACK_DRIFT_CORRECTION_MIN_INTERVAL_MS = 500

let masterClockMode: PlaybackMasterClockMode = 'idle'

export function getPlaybackMasterClockMode(): PlaybackMasterClockMode {
  return masterClockMode
}

export function setPlaybackMasterClockMode(mode: PlaybackMasterClockMode): void {
  masterClockMode = mode
}

/** 順方向再生では Web Audio をマスタークロックにする */
export function shouldUseAudioMasterClock(playing: boolean, shuttleRate: PlaybackShuttleRate): boolean {
  return playing && !isReverseShuttleRate(shuttleRate)
}

export function computePlaybackDrift(a: number, b: number): number {
  return Math.abs(a - b)
}

export function shouldCorrectPlaybackDrift(
  driftSec: number,
  lastCorrectionMs: number,
  nowMs: number,
): boolean {
  return driftSec > PLAYBACK_DRIFT_CORRECTION_THRESHOLD_SEC
    && nowMs - lastCorrectionMs >= PLAYBACK_DRIFT_CORRECTION_MIN_INTERVAL_MS
}

/** マスタークロック（AudioContext）と壁時計のうち、再生位置に使う時刻を返す */
export function resolveMasterPlaybackTime(params: {
  playing: boolean
  shuttleRate: PlaybackShuttleRate
  audioTimelineTime: number
  audioIsPlaying: boolean
  wallTimelineTime: number
}): { time: number; mode: PlaybackMasterClockMode } {
  if (!params.playing) {
    return { time: params.wallTimelineTime, mode: 'idle' }
  }

  if (shouldUseAudioMasterClock(params.playing, params.shuttleRate)) {
    if (params.audioIsPlaying) {
      return { time: params.audioTimelineTime, mode: 'audio' }
    }
    return { time: params.wallTimelineTime, mode: 'audio' }
  }

  return { time: params.wallTimelineTime, mode: 'wall' }
}
