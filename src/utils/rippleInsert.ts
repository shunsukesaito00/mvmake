import type { Clip } from '../types/project'
import { resolveClipOverlap, rippleShiftClips } from './clipUtils'

/** クリップの途中（境界の開始点を除く）でなければリップルインサート可能 */
export function canRippleInsertAt(clips: Clip[], time: number): boolean {
  return !clips.some((c) => time > c.startTime && time < c.startTime + c.duration)
}

export function prepareTrackClipsForInsert(
  clips: Clip[],
  newClip: Clip,
  insertTime: number,
  rippleInsert: boolean,
): Clip[] {
  const start = Math.max(0, insertTime)
  const clip = { ...newClip, startTime: start }

  if (rippleInsert && canRippleInsertAt(clips, start)) {
    return [...rippleShiftClips(clips, start, clip.duration), clip]
  }

  const resolvedStart = resolveClipOverlap(clip, clips, start)
  return [...clips, { ...clip, startTime: resolvedStart }]
}
