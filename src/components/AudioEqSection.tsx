import type { AudioEqSettings, AudioSettings } from '../types/project'
import { DEFAULT_AUDIO_EQ } from '../types/project'
import { EQ_GAIN_MAX, EQ_GAIN_MIN, EQ_HIGH_FREQ, EQ_LOW_FREQ, EQ_MID_FREQ } from '../utils/audioEq'
import { Slider } from './ui'

interface Props {
  audio: AudioSettings
  onAudioChange: (patch: Partial<AudioSettings>) => void
}

export function AudioEqSection({ audio, onAudioChange }: Props) {
  const eq = audio.eq ?? DEFAULT_AUDIO_EQ

  const updateEq = (patch: Partial<AudioEqSettings>) => {
    onAudioChange({ eq: { ...eq, ...patch } })
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-xs text-text-secondary">
        <input
          type="checkbox"
          checked={eq.enabled}
          onChange={(e) => updateEq({ enabled: e.target.checked })}
          className="accent-accent"
        />
        イコライザーを有効化
      </label>
      {eq.enabled && (
        <>
          <p className="text-[10px] leading-relaxed text-text-muted">
            低域 {EQ_LOW_FREQ}Hz / 中域 {EQ_MID_FREQ}Hz / 高域 {EQ_HIGH_FREQ}Hz の3バンド EQ
          </p>
          <Slider
            label="低域"
            value={eq.lowGain}
            min={EQ_GAIN_MIN}
            max={EQ_GAIN_MAX}
            step={0.5}
            onChange={(v) => updateEq({ lowGain: v })}
            format={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)} dB`}
          />
          <Slider
            label="中域"
            value={eq.midGain}
            min={EQ_GAIN_MIN}
            max={EQ_GAIN_MAX}
            step={0.5}
            onChange={(v) => updateEq({ midGain: v })}
            format={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)} dB`}
          />
          <Slider
            label="高域"
            value={eq.highGain}
            min={EQ_GAIN_MIN}
            max={EQ_GAIN_MAX}
            step={0.5}
            onChange={(v) => updateEq({ highGain: v })}
            format={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)} dB`}
          />
        </>
      )}
    </div>
  )
}
