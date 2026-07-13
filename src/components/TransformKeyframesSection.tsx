import { useState } from 'react'
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
import {
  clampTransformTimelinePropertyValue,
  getTransformTimelinePropertyRange,
  getTransformTimelinePropertyStep,
  keyframePropertyValue,
  type TransformTimelineProperty,
} from '../utils/transformKeyframesTimeline'
import { createId } from '../utils/id'
import { TransformKeyframeGraphEditor } from './TransformKeyframeGraphEditor'
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
  const navSelection = useProjectStore((s) => s.selectedNavKeyframe)
  const setNavSelection = useProjectStore((s) => s.setSelectedNavKeyframe)
  const keyframes = transformKeyframes ?? []
  const [selectedProperty, setSelectedProperty] = useState<TransformTimelineProperty>('scale')

  const selectedKeyframeId =
    navSelection?.clipId === clip.id
    && navSelection.type === 'transform'
    && keyframes.some((kf) => kf.id === navSelection.keyframeId)
      ? navSelection.keyframeId
      : keyframes[0]?.id ?? null

  const setSelectedKeyframeId = (id: string | null) => {
    if (id) setNavSelection({ clipId: clip.id, type: 'transform', keyframeId: id })
    else if (navSelection?.clipId === clip.id && navSelection.type === 'transform') setNavSelection(null)
  }

  const updateKeyframes = (next: TransformKeyframe[]) => {
    onTransformChange({ transformKeyframes: next.length ? sortTransformKeyframes(next) : undefined })
  }

  const addKeyframe = () => {
    pushHistory()
    const localT = Math.max(0, Math.min(clip.duration, currentTime - clip.startTime))
    const resolved = getTransformAtLocalTime(transform, keyframes, localT, clip.duration)
    const next = {
      id: createId(),
      time: localT,
      x: resolved.x,
      y: resolved.y,
      scale: resolved.scale,
      rotation: resolved.rotation,
      opacity: resolved.opacity,
    }
    setSelectedKeyframeId(next.id)
    updateKeyframes([...keyframes, next])
  }

  const updateKeyframe = (id: string, patch: Partial<TransformKeyframe>) => {
    updateKeyframes(keyframes.map((kf) => (kf.id === id ? { ...kf, ...patch } : kf)))
  }

  const commitKeyframeHistory = () => {
    pushHistory()
  }

  const removeKeyframe = (id: string) => {
    pushHistory()
    updateKeyframes(keyframes.filter((kf) => kf.id !== id))
  }

  const renderPropertySlider = (
    kf: TransformKeyframe,
    property: TransformTimelineProperty,
    label: string,
    format?: (v: number) => string,
  ) => {
    const { min, max } = getTransformTimelinePropertyRange(property)
    const step = getTransformTimelinePropertyStep(property)
    const value = keyframePropertyValue(kf, transform, property)
    const patchKey = property === 'opacity' ? 'opacity' : property

    return (
      <Slider
        key={property}
        label={label}
        value={value}
        min={min}
        max={max}
        step={step}
        editable
        format={format}
        onChange={(v) => updateKeyframe(kf.id, { [patchKey]: clampTransformTimelinePropertyValue(property, v) })}
        onInputCommit={commitKeyframeHistory}
      />
    )
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
          再生ヘッド位置(クリップ内)に位置・スケール・回転・不透明度のキーフレームを追加できます。2点以上で時間変化を作れます。
        </p>
      ) : (
        <>
          <TransformKeyframeGraphEditor
            transform={transform}
            keyframes={keyframes}
            clipDuration={clip.duration}
            selectedProperty={selectedProperty}
            selectedKeyframeId={selectedKeyframeId}
            onSelectProperty={setSelectedProperty}
            onSelectKeyframe={setSelectedKeyframeId}
          />
          {keyframes.map((kf, index) => {
            const selected = kf.id === selectedKeyframeId
            return (
              <div
                key={kf.id}
                className={`space-y-1.5 rounded-lg p-2 ring-1 transition-colors ${
                  selected ? 'bg-surface-3 ring-sky-400/40' : 'bg-surface-3 ring-border'
                }`}
                onClick={() => setSelectedKeyframeId(kf.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-text-secondary">キーフレーム {index + 1}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeKeyframe(kf.id)
                    }}
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
                  editable
                  onChange={(v) => updateKeyframe(kf.id, { time: v })}
                  onInputCommit={commitKeyframeHistory}
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
                    {(kf.easing === 'bezier' || kf.bezierHandles) && (
                      <span className="text-[10px] text-text-muted">タイムラインの丸ハンドルでベジェ曲線を編集できます。</span>
                    )}
                  </label>
                )}
                {renderPropertySlider(kf, 'x', 'X')}
                {renderPropertySlider(kf, 'y', 'Y')}
                {renderPropertySlider(kf, 'scale', 'スケール')}
                {renderPropertySlider(kf, 'rotation', '回転', (v) => `${v}°`)}
                {renderPropertySlider(kf, 'opacity', '不透明度')}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
