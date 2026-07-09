import type { ImageClip, TextClip, Transform, TransformKeyframe, VideoClip } from '../types/project'
import { TRANSFORM_TIMELINE_LANE_HEIGHT, keyframeToTimelineX } from '../utils/transformKeyframesTimeline'

type TransformClipLike = VideoClip | ImageClip | TextClip

interface Props {
  clip: TransformClipLike
  transform: Transform
  transformKeyframes?: TransformKeyframe[]
  widthPx: number
  onStartKeyframeDrag: (keyframe: TransformKeyframe, e: React.MouseEvent) => void
}

export function TransformKeyframesTimeline({
  clip,
  transformKeyframes,
  widthPx,
  onStartKeyframeDrag,
}: Props) {
  const keyframes = transformKeyframes ?? []

  if (!keyframes.length || widthPx < 24) return null

  return (
    <div
      className="absolute top-0 right-0 left-0 z-[15] pointer-events-none"
      style={{ height: TRANSFORM_TIMELINE_LANE_HEIGHT }}
    >
      {keyframes.map((kf, index) => {
        const x = keyframeToTimelineX(kf, clip.duration, widthPx)
        return (
          <button
            key={kf.id}
            type="button"
            aria-label={`トランスフォームキーフレーム ${index + 1}`}
            title={`${kf.time.toFixed(1)}s · X ${Math.round(kf.x * 100)}%`}
            className="pointer-events-auto absolute top-1/2 z-[16] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 cursor-ew-resize border border-white/80 bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)] active:cursor-grabbing"
            style={{ left: x }}
            onMouseDown={(e) => onStartKeyframeDrag(kf, e)}
            onClick={(e) => e.stopPropagation()}
          />
        )
      })}
    </div>
  )
}
