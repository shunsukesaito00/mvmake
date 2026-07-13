import { useEffect, useRef, useState } from 'react'
import { useProjectStore } from '../store/projectStore'
import { usePlaybackControls } from '../contexts/PlaybackContext'
import { audioEngine } from '../engine/audioEngine'
import { shouldUpdatePlaybackVu } from '../utils/playbackPreviewQuality'
import { IconButton } from '../components/ui'
import { Icons } from '../components/icons'

function VuMeter({ level }: { level: number }) {
  const pct = Math.round(Math.min(1, level) * 100)
  return (
    <div className="relative h-16 w-2 overflow-hidden rounded-sm bg-surface-0 ring-1 ring-border">
      <div
        className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-emerald-500 via-amber-400 to-red-500 transition-[height] duration-75"
        style={{ height: `${pct}%` }}
      />
    </div>
  )
}

function MixerStrip({
  trackId,
  name,
  vuLevel,
}: {
  trackId: string
  name: string
  vuLevel: number
}) {
  const track = useProjectStore((s) => s.project.tracks.find((t) => t.id === trackId)!)
  const toggleTrackMute = useProjectStore((s) => s.toggleTrackMute)
  const toggleTrackSolo = useProjectStore((s) => s.toggleTrackSolo)
  const setTrackVolume = useProjectStore((s) => s.setTrackVolume)
  const pushHistory = useProjectStore((s) => s.pushHistory)
  const draggingRef = useRef(false)

  const volume = track.volume ?? 1

  return (
    <div className="flex w-[72px] shrink-0 flex-col items-center gap-1.5 rounded-lg bg-surface-2 px-2 py-2 ring-1 ring-border">
      <span className="w-full truncate text-center text-[9px] font-medium text-text-secondary" title={name}>
        {name}
      </span>
      <VuMeter level={vuLevel} />
      <input
        type="range"
        aria-label={`${name} フェーダー`}
        min={0}
        max={2}
        step={0.01}
        value={volume}
        className="h-16 w-full accent-accent"
        style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
        onChange={(e) => {
          if (!draggingRef.current) {
            pushHistory()
            draggingRef.current = true
          }
          setTrackVolume(trackId, parseFloat(e.target.value), false)
        }}
        onMouseUp={() => { draggingRef.current = false }}
        onTouchEnd={() => { draggingRef.current = false }}
      />
      <div className="flex gap-1">
        <button
          type="button"
          aria-label={`${name} ソロ`}
          aria-pressed={track.solo === true}
          onClick={() => toggleTrackSolo(trackId)}
          className={`h-6 w-6 rounded text-[10px] font-bold transition-colors ${
            track.solo ? 'bg-amber-500 text-black' : 'bg-surface-3 text-text-muted hover:bg-surface-4'
          }`}
        >
          S
        </button>
        <IconButton
          active={track.muted === true}
          onClick={() => toggleTrackMute(trackId)}
          tooltip="ミュート"
          size="sm"
          variant={track.muted ? 'danger' : 'ghost'}
        >
          {track.muted ? <Icons.VolumeOff size={12} /> : <Icons.Volume size={12} />}
        </IconButton>
      </div>
      <span className="font-mono text-[9px] text-text-muted">{Math.round(volume * 100)}%</span>
    </div>
  )
}

export function MixerPanel() {
  const tracks = useProjectStore((s) => s.project.tracks)
  const isPlaying = useProjectStore((s) => s.isPlaying)
  const { subscribeFrame } = usePlaybackControls()
  const [vuLevels, setVuLevels] = useState<Record<string, number>>({})
  const lastVuUpdateMsRef = useRef(0)
  const mixerTracks = tracks.filter((t) => t.type === 'video' || t.type === 'audio')

  useEffect(() => {
    return subscribeFrame(() => {
      const now = performance.now()
      if (isPlaying && !shouldUpdatePlaybackVu(lastVuUpdateMsRef.current, now)) return
      lastVuUpdateMsRef.current = now
      setVuLevels(audioEngine.getTrackVuLevels(useProjectStore.getState().project))
    })
  }, [subscribeFrame, isPlaying])

  if (mixerTracks.length === 0) return null

  return (
    <section
      aria-label="オーディオミキサー"
      className="flex h-full flex-col border-b border-border bg-surface-1"
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-1.5">
        <Icons.Music size={12} className="text-accent" />
        <span className="text-[10px] font-semibold tracking-wider text-text-secondary uppercase">ミキサー</span>
      </div>
      <div className="flex flex-1 items-end gap-2 overflow-x-auto px-3 py-2">
        {mixerTracks.map((track) => (
          <MixerStrip
            key={track.id}
            trackId={track.id}
            name={track.name}
            vuLevel={vuLevels[track.id] ?? 0}
          />
        ))}
      </div>
    </section>
  )
}
