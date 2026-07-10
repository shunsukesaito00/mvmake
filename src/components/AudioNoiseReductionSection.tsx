import type { AudioNoiseReductionSettings, AudioSettings } from '../types/project'
import { DEFAULT_AUDIO_NOISE_REDUCTION } from '../types/project'
import {
  NOISE_GATE_STRENGTH_MAX,
  NOISE_GATE_STRENGTH_MIN,
  NOISE_HIGH_PASS_MAX,
  NOISE_HIGH_PASS_MIN,
  NOISE_LOW_PASS_MAX,
  NOISE_LOW_PASS_MIN,
} from '../utils/audioNoiseReduction'
import { Slider } from './ui'

interface Props {
  audio: AudioSettings
  onAudioChange: (patch: Partial<AudioSettings>) => void
}

export function AudioNoiseReductionSection({ audio, onAudioChange }: Props) {
  const nr = audio.noiseReduction ?? DEFAULT_AUDIO_NOISE_REDUCTION

  const updateNoiseReduction = (patch: Partial<AudioNoiseReductionSettings>) => {
    onAudioChange({ noiseReduction: { ...nr, ...patch } })
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-xs text-text-secondary">
        <input
          type="checkbox"
          checked={nr.enabled}
          onChange={(e) => updateNoiseReduction({ enabled: e.target.checked })}
          className="accent-accent"
        />
        ノイズ除去を有効化
      </label>
      {nr.enabled && (
        <>
          <p className="text-[10px] leading-relaxed text-text-muted">
            ハイパス・ローパス・簡易ゲートでナレーションの雑音を軽減します
          </p>
          <Slider
            label="ハイパス"
            value={nr.highPassHz}
            min={NOISE_HIGH_PASS_MIN}
            max={NOISE_HIGH_PASS_MAX}
            step={5}
            onChange={(v) => updateNoiseReduction({ highPassHz: v })}
            format={(v) => `${Math.round(v)} Hz`}
          />
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <input
              type="checkbox"
              checked={nr.lowPassHz > 0}
              onChange={(e) =>
                updateNoiseReduction({ lowPassHz: e.target.checked ? NOISE_LOW_PASS_MIN : 0 })
              }
              className="accent-accent"
            />
            高周波ヒス除去（ローパス）
          </label>
          {nr.lowPassHz > 0 && (
            <Slider
              label="ローパス"
              value={nr.lowPassHz}
              min={NOISE_LOW_PASS_MIN}
              max={NOISE_LOW_PASS_MAX}
              step={100}
              onChange={(v) => updateNoiseReduction({ lowPassHz: v })}
              format={(v) => `${Math.round(v)} Hz`}
            />
          )}
          <Slider
            label="ゲート強度"
            value={nr.gateStrength}
            min={NOISE_GATE_STRENGTH_MIN}
            max={NOISE_GATE_STRENGTH_MAX}
            step={0.05}
            onChange={(v) => updateNoiseReduction({ gateStrength: v })}
            format={(v) => `${Math.round(v * 100)}%`}
          />
        </>
      )}
    </div>
  )
}
