import { useProjectStore } from '../store/projectStore'
import type { AudioClip, AudioSettings, VideoClip, VolumeKeyframe } from '../types/project'
import { getVolumeAtLocalTime, sortVolumeKeyframes } from '../utils/volumeKeyframes'
import { createId } from '../utils/id'
import { VolumeKeyframeGraphEditor } from './VolumeKeyframeGraphEditor'
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
  const navSelection = useProjectStore((s) => s.selectedNavKeyframe)
  const setNavSelection = useProjectStore((s) => s.setSelectedNavKeyframe)
  const keyframes = audio.volumeKeyframes ?? []

  const selectedKeyframeId =
    navSelection?.clipId === clip.id
    && navSelection.type === 'volume'
    && keyframes.some((kf) => kf.id === navSelection.keyframeId)
      ? navSelection.keyframeId
      : keyframes[0]?.id ?? null

  const setSelectedKeyframeId = (id: string | null) => {
    if (id) setNavSelection({ clipId: clip.id, type: 'volume', keyframeId: id })
    else if (navSelection?.clipId === clip.id && navSelection.type === 'volume') setNavSelection(null)
  }

  const updateKeyframes = (next: VolumeKeyframe[]) => {
    onAudioChange({ volumeKeyframes: next.length ? sortVolumeKeyframes(next) : undefined })
  }

  const addKeyframe = () => {
    pushHistory()
    const localT = Math.max(0, Math.min(clip.duration, currentTime - clip.startTime))
    const volume = getVolumeAtLocalTime(audio, localT, clip.duration)
    const next = { id: createId(), time: localT, volume }
    setSelectedKeyframeId(next.id)
    updateKeyframes([...keyframes, next])
  }

  const updateKeyframe = (id: string, patch: Partial<VolumeKeyframe>) => {
    updateKeyframes(keyframes.map((kf) => (kf.id === id ? { ...kf, ...patch } : kf)))
  }

  const commitKeyframeHistory = () => {
    pushHistory()
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
          再生ヘッド位置(クリップ内)に音量キーフレームを追加できます。2点以上でクリップ内の音量変化を作れます。
        </p>
      ) : (
        <>
          <VolumeKeyframeGraphEditor
            audio={audio}
            keyframes={keyframes}
            clipDuration={clip.duration}
            selectedKeyframeId={selectedKeyframeId}
            onSelectKeyframe={setSelectedKeyframeId}
          />
          {keyframes.map((kf, index) => {
            const selected = kf.id === selectedKeyframeId
            return (
              <div
                key={kf.id}
                className={`space-y-1.5 rounded-lg p-2 ring-1 transition-colors ${
                  selected ? 'bg-surface-3 ring-emerald-400/40' : 'bg-surface-3 ring-border'
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
                  step={0.05}
                  editable
                  onChange={(v) => updateKeyframe(kf.id, { time: v })}
                  onInputCommit={commitKeyframeHistory}
                  format={(v) => `${v.toFixed(2)}s`}
                />
                <Slider
                  label="音量"
                  value={kf.volume}
                  min={0}
                  max={2}
                  step={0.01}
                  editable
                  onChange={(v) => updateKeyframe(kf.id, { volume: v })}
                  onInputCommit={commitKeyframeHistory}
                />
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
