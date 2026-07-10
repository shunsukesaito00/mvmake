import { useProjectStore } from '../store/projectStore'
import type { SpeedKeyframe, VideoClip } from '../types/project'
import { SPEED_MAX, SPEED_MIN, getSpeedAtLocalTime, sortSpeedKeyframes } from '../utils/speedKeyframes'
import { createId } from '../utils/id'
import { Btn, Slider } from './ui'

interface Props {
  clip: VideoClip
  onClipChange: (patch: Partial<VideoClip>) => void
}

export function SpeedKeyframesSection({ clip, onClipChange }: Props) {
  const currentTime = useProjectStore((s) => s.currentTime)
  const pushHistory = useProjectStore((s) => s.pushHistory)
  const keyframes = clip.speedKeyframes ?? []

  const updateKeyframes = (next: SpeedKeyframe[]) => {
    onClipChange({ speedKeyframes: next.length ? sortSpeedKeyframes(next) : undefined })
  }

  const addKeyframe = () => {
    pushHistory()
    const localT = Math.max(0, Math.min(clip.duration, currentTime - clip.startTime))
    const speed = getSpeedAtLocalTime(clip, localT)
    updateKeyframes([...keyframes, { id: createId(), time: localT, speed }])
  }

  const updateKeyframe = (id: string, patch: Partial<SpeedKeyframe>) => {
    updateKeyframes(keyframes.map((kf) => (kf.id === id ? { ...kf, ...patch } : kf)))
  }

  const removeKeyframe = (id: string) => {
    pushHistory()
    const next = keyframes.filter((kf) => kf.id !== id)
    updateKeyframes(next)
  }

  return (
    <div className="space-y-2">
      <Slider
        label="基本速度"
        value={clip.speed}
        min={SPEED_MIN}
        max={SPEED_MAX}
        step={0.25}
        onChange={(v) => onClipChange({ speed: v })}
        format={(v) => `${v}x`}
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-text-muted">{keyframes.length}件</p>
        <Btn variant="default" className="text-[10px] px-2 py-1" onClick={addKeyframe}>
          キーフレームを追加
        </Btn>
      </div>
      {keyframes.length === 0 ? (
        <p className="text-[10px] leading-relaxed text-text-muted">
          再生ヘッド位置(クリップ内)に速度キーフレームを追加できます。2点以上でスロー/早送りのランプを作れます。
        </p>
      ) : (
        keyframes.map((kf, index) => (
          <div key={kf.id} className="space-y-1.5 rounded-lg bg-surface-3 p-2 ring-1 ring-border">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-text-secondary">キーフレーム {index + 1}</span>
              <button
                type="button"
                onClick={() => removeKeyframe(kf.id)}
                className="text-[10px] text-danger hover:underline"
              >
                削除
              </button>
            </div>
            <Slider
              label="位置 (秒)"
              value={kf.time}
              min={0}
              max={clip.duration}
              step={0.1}
              onChange={(v) => updateKeyframe(kf.id, { time: v })}
              format={(v) => `${v.toFixed(1)}s`}
            />
            <Slider
              label="速度"
              value={kf.speed}
              min={SPEED_MIN}
              max={SPEED_MAX}
              step={0.25}
              onChange={(v) => updateKeyframe(kf.id, { speed: v })}
              format={(v) => `${v}x`}
            />
          </div>
        ))
      )}
    </div>
  )
}
