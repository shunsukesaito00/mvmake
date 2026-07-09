import { useProjectStore } from '../store/projectStore'
import {
  TRANSFORM_KEYFRAME_EASING_OPTIONS,
  type ImageClip,
  type TextClip,
  type Transform,
  type TransformKeyframe,
  type VideoClip,
} from '../types/project'
import { getTransformAtLocalTime, sortTransformKeyframes } from '../utils/transformKeyframes'
import { createId } from '../utils/id'
import { Btn, Slider } from './ui'

type TransformClipLike = VideoClip | ImageClip | TextClip

interface Props {
  clip: TransformClipLike
  transform: Transform
  transformKeyframes?: TransformKeyframe[]
  onTransformChange: (patch: { transformKeyframes?: TransformKeyframe[] }) => void
}

export function TransformKeyframesSection({ clip, transform, transformKeyframes, onTransformChange }: Props) {
  const currentTime = useProjectStore((s) => s.currentTime)
  const pushHistory = useProjectStore((s) => s.pushHistory)
  const keyframes = transformKeyframes ?? []

  const updateKeyframes = (next: TransformKeyframe[]) => {
    onTransformChange({ transformKeyframes: next.length ? sortTransformKeyframes(next) : undefined })
  }

  const addKeyframe = () => {
    pushHistory()
    const localT = Math.max(0, Math.min(clip.duration, currentTime - clip.startTime))
    const resolved = getTransformAtLocalTime(transform, keyframes, localT, clip.duration)
    updateKeyframes([
      ...keyframes,
      { id: createId(), time: localT, x: resolved.x, y: resolved.y, scale: resolved.scale, rotation: resolved.rotation },
    ])
  }

  const updateKeyframe = (id: string, patch: Partial<TransformKeyframe>) => {
    updateKeyframes(keyframes.map((kf) => (kf.id === id ? { ...kf, ...patch } : kf)))
  }

  const removeKeyframe = (id: string) => {
    pushHistory()
    updateKeyframes(keyframes.filter((kf) => kf.id !== id))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-text-muted">{keyframes.length}件</p>
        <Btn variant="default" className="text-[10px] px-2 py-1" onClick={addKeyframe}>
          キーフレームを追加
        </Btn>
      </div>
      {keyframes.length === 0 ? (
        <p className="text-[10px] leading-relaxed text-text-muted">
          再生ヘッド位置(クリップ内)に位置・スケール・回転のキーフレームを追加できます。2点以上で時間変化を作れます。
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
            {index > 0 && (
              <label className="flex flex-col gap-1 text-xs text-text-secondary">
                補間イージング
                <select
                  aria-label="補間イージング"
                  value={kf.easing ?? 'linear'}
                  onChange={(e) => updateKeyframe(kf.id, { easing: e.target.value as TransformKeyframe['easing'] })}
                  className="w-full rounded-lg bg-surface-3 p-2 text-xs text-text-secondary ring-1 ring-border"
                >
                  {TRANSFORM_KEYFRAME_EASING_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
            )}
            <Slider label="X" value={kf.x} min={0} max={1} step={0.01} onChange={(v) => updateKeyframe(kf.id, { x: v })} />
            <Slider label="Y" value={kf.y} min={0} max={1} step={0.01} onChange={(v) => updateKeyframe(kf.id, { y: v })} />
            <Slider label="スケール" value={kf.scale} min={0.1} max={3} step={0.01} onChange={(v) => updateKeyframe(kf.id, { scale: v })} />
            <Slider
              label="回転"
              value={kf.rotation}
              min={-180}
              max={180}
              step={1}
              onChange={(v) => updateKeyframe(kf.id, { rotation: v })}
              format={(v) => `${v}°`}
            />
          </div>
        ))
      )}
    </div>
  )
}
