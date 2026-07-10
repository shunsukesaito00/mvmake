import { useProjectStore } from '../store/projectStore'
import type { AudioClip, AudioSettings, VideoClip, VolumeKeyframe } from '../types/project'
import { getVolumeAtLocalTime, sortVolumeKeyframes } from '../utils/volumeKeyframes'
import { createId } from '../utils/id'
import { Btn, Slider } from './ui'

type AudioClipLike = VideoClip | AudioClip

interface Props {
  clip: AudioClipLike
  audio: AudioSettings
  onAudioChange: (patch: Partial<AudioSettings>) => void
}

export function VolumeKeyframesSection({ clip, audio, onAudioChange }: Props) {
  const currentTime = useProjectStore((s) => s.currentTime)
  const pushHistory = useProjectStore((s) => s.pushHistory)
  const keyframes = audio.volumeKeyframes ?? []

  const updateKeyframes = (next: VolumeKeyframe[]) => {
    onAudioChange({ volumeKeyframes: next.length ? sortVolumeKeyframes(next) : undefined })
  }

  const addKeyframe = () => {
    pushHistory()
    const localT = Math.max(0, Math.min(clip.duration, currentTime - clip.startTime))
    const volume = getVolumeAtLocalTime(audio, localT, clip.duration)
    updateKeyframes([...keyframes, { id: createId(), time: localT, volume }])
  }

  const updateKeyframe = (id: string, patch: Partial<VolumeKeyframe>) => {
    updateKeyframes(keyframes.map((kf) => (kf.id === id ? { ...kf, ...patch } : kf)))
  }

  const removeKeyframe = (id: string) => {
    pushHistory()
    const next = keyframes.filter((kf) => kf.id !== id)
    updateKeyframes(next)
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
          再生ヘッド位置(クリップ内)に音量キーフレームを追加できます。2点以上でクリップ内の音量変化を作れます。
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
              step={0.05}
              onChange={(v) => updateKeyframe(kf.id, { time: v })}
              format={(v) => `${v.toFixed(2)}s`}
            />
            <Slider
              label="音量"
              value={kf.volume}
              min={0}
              max={2}
              step={0.01}
              onChange={(v) => updateKeyframe(kf.id, { volume: v })}
            />
          </div>
        ))
      )}
    </div>
  )
}
