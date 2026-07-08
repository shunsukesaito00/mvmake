import type { AudioClip, AudioSettings, VideoClip, VolumeKeyframe } from '../types/project'
import {
  VOLUME_TIMELINE_LANE_HEIGHT,
  buildVolumeCurvePath,
  keyframeToLanePoint,
  laneYToVolume,
} from '../utils/volumeKeyframesTimeline'

type AudioClipLike = VideoClip | AudioClip

interface Props {
  clip: AudioClipLike
  audio: AudioSettings
  widthPx: number
  isSelected: boolean
  onStartKeyframeDrag: (keyframe: VolumeKeyframe, e: React.MouseEvent) => void
  onAddKeyframe: (time: number, volume: number) => void
}

export function VolumeKeyframesTimeline({
  clip,
  audio,
  widthPx,
  isSelected,
  onStartKeyframeDrag,
  onAddKeyframe,
}: Props) {
  const keyframes = audio.volumeKeyframes ?? []
  const laneHeight = VOLUME_TIMELINE_LANE_HEIGHT
  const showLane = keyframes.length > 0 || isSelected

  if (!showLane || widthPx < 24) return null

  const curvePath = buildVolumeCurvePath(audio, clip.duration, widthPx, laneHeight)

  const handleDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const localX = Math.max(0, Math.min(widthPx, e.clientX - rect.left))
    const localY = Math.max(0, Math.min(laneHeight, e.clientY - rect.top))
    const time = (localX / widthPx) * clip.duration
    const volume = laneYToVolume(localY, laneHeight)
    onAddKeyframe(time, volume)
  }

  return (
    <div
      className="absolute right-0 bottom-0 left-0 z-[15] pointer-events-none"
      style={{ height: laneHeight }}
      aria-hidden={!keyframes.length}
    >
      <svg
        className="pointer-events-auto h-full w-full overflow-visible"
        viewBox={`0 0 ${widthPx} ${laneHeight}`}
        preserveAspectRatio="none"
        onDoubleClick={handleDoubleClick}
      >
        {keyframes.length >= 2 && curvePath && (
          <path
            d={curvePath}
            fill="none"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {keyframes.length === 1 && (
          <line
            x1={0}
            y1={keyframeToLanePoint(keyframes[0], clip.duration, widthPx, laneHeight).y}
            x2={widthPx}
            y2={keyframeToLanePoint(keyframes[0], clip.duration, widthPx, laneHeight).y}
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="1"
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      {keyframes.map((kf, index) => {
        const { x, y } = keyframeToLanePoint(kf, clip.duration, widthPx, laneHeight)
        return (
          <button
            key={kf.id}
            type="button"
            aria-label={`音量キーフレーム ${index + 1}`}
            title={`${kf.time.toFixed(1)}s · ${Math.round(kf.volume * 100)}%`}
            className="pointer-events-auto absolute z-[16] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border border-white/80 bg-accent shadow-[0_0_6px_rgba(201,169,110,0.8)] active:cursor-grabbing"
            style={{ left: x, top: y }}
            onMouseDown={(e) => onStartKeyframeDrag(kf, e)}
            onClick={(e) => e.stopPropagation()}
          />
        )
      })}
    </div>
  )
}
