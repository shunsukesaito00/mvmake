import { useProjectStore } from '../store/projectStore'
import type { VideoClip } from '../types/project'
import { isSpeedAudioLinked, isSpeedPreservePitch } from '../utils/speedAudioLink'
import { Btn } from './ui'

interface Props {
  clip: VideoClip
  onClipChange: (patch: Partial<VideoClip>, recordHistory?: boolean) => void
}

export function SpeedAudioLinkSection({ clip, onClipChange }: Props) {
  const pushHistory = useProjectStore((s) => s.pushHistory)
  const linked = isSpeedAudioLinked(clip)
  const preservePitch = isSpeedPreservePitch(clip)

  const toggleLink = () => {
    pushHistory()
    onClipChange({ speedAudioLinked: !linked })
  }

  const togglePreservePitch = () => {
    pushHistory()
    onClipChange({ speedPreservePitch: !preservePitch })
  }

  return (
    <div className="space-y-2 rounded-lg bg-surface-3 p-2 ring-1 ring-border" data-testid="speed-audio-link-section">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-text-muted" data-testid="speed-audio-link-status">
          {linked
            ? preservePitch
              ? '内蔵音声は速度キーフレームに連動（ピッチ維持ストレッチ）'
              : '内蔵音声は速度キーフレームに連動（ピッチも変化）'
            : '内蔵音声は通常速度（映像のみタイムリマップ）'}
        </p>
        <Btn
          variant="default"
          className="text-[10px] px-2 py-1"
          data-testid={linked ? 'speed-audio-detach' : 'speed-audio-link'}
          onClick={toggleLink}
        >
          {linked ? '音声連動を解除' : '音声連動を有効化'}
        </Btn>
      </div>
      {linked && (
        <>
          <label className="flex items-center gap-2 text-[10px] text-text-secondary">
            <input
              type="checkbox"
              checked={preservePitch}
              onChange={togglePreservePitch}
              className="accent-accent"
              data-testid="speed-preserve-pitch-toggle"
            />
            ピッチ維持タイムストレッチ（プレビュー/書き出し）
          </label>
          <p className="text-[10px] leading-relaxed text-text-muted">
            {preservePitch
              ? '速度カーブに合わせて素材区間を伸縮し、ピッチを保ったまま再生します（線形補間）。'
              : 'プレビューと書き出しで同一の速度カーブを適用します。スローモーション時はピッチも下がります。'}
          </p>
        </>
      )}
    </div>
  )
}
