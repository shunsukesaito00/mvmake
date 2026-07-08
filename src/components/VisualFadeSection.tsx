import { Slider } from './ui'

interface Props {
  fadeIn: number
  fadeOut: number
  clipDuration: number
  onChange: (patch: { fadeIn?: number; fadeOut?: number }, recordHistory?: boolean) => void
}

export function VisualFadeSection({ fadeIn, fadeOut, clipDuration, onChange }: Props) {
  const maxFade = Math.max(0.1, Math.min(5, clipDuration / 2))

  return (
    <div className="space-y-3">
      <Slider
        label="フェードイン"
        value={fadeIn}
        min={0}
        max={maxFade}
        step={0.1}
        onChange={(v) => onChange({ fadeIn: v }, true)}
        format={(v) => `${v.toFixed(1)}秒`}
      />
      <Slider
        label="フェードアウト"
        value={fadeOut}
        min={0}
        max={maxFade}
        step={0.1}
        onChange={(v) => onChange({ fadeOut: v }, true)}
        format={(v) => `${v.toFixed(1)}秒`}
      />
    </div>
  )
}
