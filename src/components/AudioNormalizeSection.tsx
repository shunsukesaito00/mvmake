import { useState } from 'react'
import type { AudioSettings, MediaAsset } from '../types/project'
import {
  DEFAULT_NORMALIZE_TARGET_PEAK,
  formatNormalizeResult,
  normalizeAudioSettingsFromBlob,
} from '../utils/audioNormalize'
import { useToastStore } from '../store/toastStore'
import { Btn } from './ui'

interface AudioNormalizeSectionProps {
  asset: MediaAsset | undefined
  sourceStart: number
  sourceDuration: number
  audio: AudioSettings
  onApply: (audio: AudioSettings) => void
}

export function AudioNormalizeSection({
  asset,
  sourceStart,
  sourceDuration,
  audio,
  onApply,
}: AudioNormalizeSectionProps) {
  const [busy, setBusy] = useState(false)
  const showToast = useToastStore((s) => s.showToast)

  const handleNormalize = async () => {
    if (!asset) {
      showToast('メディアが見つかりません', 'error')
      return
    }

    setBusy(true)
    try {
      const result = await normalizeAudioSettingsFromBlob(
        asset.blob,
        audio,
        sourceStart,
        sourceDuration,
        DEFAULT_NORMALIZE_TARGET_PEAK,
      )
      onApply(result.audio)
      showToast(`音量を正規化しました（${formatNormalizeResult(result.measuredPeak, result.multiplier)}）`, 'success')
    } catch {
      showToast('音声の解析に失敗しました', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <Btn variant="default" className="w-full text-xs" onClick={() => void handleNormalize()} disabled={busy || !asset}>
        {busy ? '解析中…' : '音量を正規化'}
      </Btn>
      <p className="text-[10px] leading-relaxed text-text-muted">
        クリップ素材のピークを約 {Math.round(DEFAULT_NORMALIZE_TARGET_PEAK * 100)}% に合わせます。プレビューと書き出しの両方に反映されます。
      </p>
    </div>
  )
}
