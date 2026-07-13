import { useProjectStore } from '../store/projectStore'
import type { VideoClip } from '../types/project'
import { isSpeedAudioLinked } from '../utils/speedAudioLink'
import { Btn } from './ui'

interface Props {
  clip: VideoClip
  onClipChange: (patch: Partial<VideoClip>, recordHistory?: boolean) => void
}

export function SpeedAudioLinkSection({ clip, onClipChange }: Props) {
  const pushHistory = useProjectStore((s) => s.pushHistory)
  const linked = isSpeedAudioLinked(clip)

  const toggleLink = () => {
    pushHistory()
    onClipChange({ speedAudioLinked: !linked })
  }

  return (
    <div className="space-y-2 rounded-lg bg-surface-3 p-2 ring-1 ring-border">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-text-muted" data-testid="speed-audio-link-status">
          {linked
            ? '内蔵音声は速度キーフレームに連動（ピッチも変化）'
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
        <p className="text-[10px] leading-relaxed text-text-muted">
          プレビューと書き出しで同一の速度カーブを適用します。スローモーション時はピッチも下がります。
        </p>
      )}
    </div>
  )
}
