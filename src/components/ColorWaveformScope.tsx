import { useMemo } from 'react'
import { buildLuminanceWaveformPath, sampleLuminanceWaveform } from '../utils/colorScope'

const SCOPE_WIDTH = 240
const SCOPE_HEIGHT = 48

interface Props {
  imageData: ImageData | null
}

export function ColorWaveformScope({ imageData }: Props) {
  const path = useMemo(() => {
    if (!imageData) return ''
    const values = sampleLuminanceWaveform(imageData, 48)
    return buildLuminanceWaveformPath(values, SCOPE_WIDTH, SCOPE_HEIGHT)
  }, [imageData])

  return (
    <div
      className="rounded-lg bg-black/70 p-2 ring-1 ring-border backdrop-blur-sm"
      data-testid="color-waveform-scope"
      aria-label="輝度波形スコープ"
    >
      <p className="mb-1 text-[9px] font-medium tracking-wider text-text-muted uppercase">輝度波形</p>
      <svg
        className="w-full"
        viewBox={`0 0 ${SCOPE_WIDTH} ${SCOPE_HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-hidden
      >
        <line x1={0} y1={SCOPE_HEIGHT / 2} x2={SCOPE_WIDTH} y2={SCOPE_HEIGHT / 2} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        {path && (
          <path
            d={path}
            fill="none"
            stroke="rgba(96,165,250,0.9)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
    </div>
  )
}
