import { useMemo } from 'react'
import { mapVectorScopeToCanvas, sampleVectorScopePoints } from '../utils/colorScope'

const SCOPE_SIZE = 120

interface Props {
  imageData: ImageData | null
}

export function ColorVectorScope({ imageData }: Props) {
  const points = useMemo(() => {
    if (!imageData) return []
    return sampleVectorScopePoints(imageData).map((point) =>
      mapVectorScopeToCanvas(point.u, point.v, SCOPE_SIZE),
    )
  }, [imageData])

  const center = SCOPE_SIZE / 2
  const radius = (SCOPE_SIZE * 0.9) / 2

  return (
    <div
      className="rounded-lg bg-black/70 p-2 ring-1 ring-border backdrop-blur-sm"
      data-testid="color-vector-scope"
      aria-label="ベクトルスコープ"
    >
      <p className="mb-1 text-[9px] font-medium tracking-wider text-text-muted uppercase">ベクトル</p>
      <svg
        className="mx-auto block"
        width={SCOPE_SIZE}
        height={SCOPE_SIZE}
        viewBox={`0 0 ${SCOPE_SIZE} ${SCOPE_SIZE}`}
        role="img"
        aria-hidden
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />
        <line x1={center} y1={0} x2={center} y2={SCOPE_SIZE} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <line x1={0} y1={center} x2={SCOPE_SIZE} y2={center} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={0.7}
            fill="rgba(96,165,250,0.35)"
          />
        ))}
      </svg>
    </div>
  )
}
