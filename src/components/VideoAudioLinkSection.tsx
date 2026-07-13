import { useProjectStore } from '../store/projectStore'
import type { VideoClip } from '../types/project'
import { isVideoAudioLinked } from '../utils/videoAudioLink'
import { Btn } from './ui'

interface Props {
  clip: VideoClip
  onClipChange: (patch: Partial<VideoClip>, recordHistory?: boolean) => void
}

export function VideoAudioLinkSection({ clip, onClipChange }: Props) {
  const pushHistory = useProjectStore((s) => s.pushHistory)
  const prepareNarrationForVideoClip = useProjectStore((s) => s.prepareNarrationForVideoClip)
  const linked = isVideoAudioLinked(clip)

  const toggleLink = () => {
    pushHistory()
    onClipChange({ audioLinked: !linked })
  }

  return (
    <div className="space-y-2 rounded-lg bg-surface-3 p-2 ring-1 ring-border">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-text-muted" data-testid="video-audio-link-status">
          {linked ? '映像と内蔵音声はリンク中' : '内蔵音声は切り離し済み（ナレーション用）'}
        </p>
        <Btn
          variant="default"
          className="text-[10px] px-2 py-1"
          data-testid={linked ? 'video-audio-detach' : 'video-audio-link'}
          onClick={toggleLink}
        >
          {linked ? '音声を切り離す' : '音声をリンク'}
        </Btn>
      </div>
      {!linked && (
        <p className="text-[10px] leading-relaxed text-text-muted">
          内蔵音声はプレビュー・書き出し・BGMダッキングから除外されます。BGM トラックにナレーションを配置してください。
        </p>
      )}
      <Btn
        variant="ghost"
        className="w-full text-[10px]"
        data-testid="prepare-narration-placement"
        onClick={() => prepareNarrationForVideoClip(clip.id)}
      >
        ナレーション配置の準備（切り離し＋クリップ先頭へ移動）
      </Btn>
    </div>
  )
}
