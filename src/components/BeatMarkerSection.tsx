import { useState } from 'react'
import type { AudioClip } from '../types/project'
import { useProjectStore } from '../store/projectStore'
import { useToastStore } from '../store/toastStore'
import { Btn } from './ui'

interface BeatMarkerSectionProps {
  clip: AudioClip
}

export function BeatMarkerSection({ clip }: BeatMarkerSectionProps) {
  const currentTime = useProjectStore((s) => s.currentTime)
  const addBeatMarker = useProjectStore((s) => s.addBeatMarker)
  const addBeatMarkersAtInterval = useProjectStore((s) => s.addBeatMarkersAtInterval)
  const showToast = useToastStore((s) => s.showToast)
  const [interval, setInterval] = useState(0.5)

  const clipStart = clip.startTime
  const clipEnd = clip.startTime + clip.duration
  const atPlayhead = currentTime >= clipStart && currentTime < clipEnd

  return (
    <div className="space-y-2">
      <p className="text-[10px] leading-relaxed text-text-muted">
        ビートマーカーはタイムラインのスナップ対象になります。章マーカー書き出しには含まれません。
      </p>
      <Btn
        variant="ghost"
        className="w-full text-xs"
        onClick={() => {
          addBeatMarker(atPlayhead ? currentTime : clipStart)
          showToast('ビートマーカーを追加しました', 'success')
        }}
      >
        {atPlayhead ? '再生位置にビートマーカー追加' : 'クリップ先頭にビートマーカー追加'}
      </Btn>
      <div className="flex items-center gap-2">
        <label className="shrink-0 text-[10px] text-text-muted">間隔(秒)</label>
        <input
          type="number"
          aria-label="ビートマーカー間隔"
          min={0.1}
          max={10}
          step={0.1}
          value={interval}
          onChange={(e) => setInterval(Math.max(0.1, Number(e.target.value) || 0.5))}
          className="w-full rounded-lg bg-surface-3 px-2 py-1 font-mono text-xs text-text-primary ring-1 ring-border focus:ring-accent/50 focus:outline-none"
        />
      </div>
      <Btn
        variant="accent"
        className="w-full text-xs"
        onClick={() => {
          const count = addBeatMarkersAtInterval(interval)
          if (count === 0) showToast('ビートマーカーを配置できませんでした', 'info')
          else showToast(`${count} 件のビートマーカーを配置しました`, 'success')
        }}
      >
        クリップ内に等間隔配置
      </Btn>
    </div>
  )
}
