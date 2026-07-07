import { useCallback, useRef, useState } from 'react'

const STORAGE_KEY = 'fable-layout'

interface LayoutSizes {
  leftWidth: number
  rightWidth: number
  timelineHeight: number
}

const DEFAULTS: LayoutSizes = {
  leftWidth: 280,
  rightWidth: 300,
  timelineHeight: 220,
}

const LIMITS: Record<keyof LayoutSizes, [number, number]> = {
  leftWidth: [200, 480],
  rightWidth: [240, 480],
  timelineHeight: [140, 480],
}

function loadSizes(): LayoutSizes {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    // 破損データは無視してデフォルトに戻す
  }
  return { ...DEFAULTS }
}

function clamp(key: keyof LayoutSizes, value: number): number {
  const [min, max] = LIMITS[key]
  return Math.max(min, Math.min(max, value))
}

export function usePanelSizes() {
  const [sizes, setSizes] = useState<LayoutSizes>(loadSizes)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const update = useCallback((key: keyof LayoutSizes, value: number) => {
    setSizes((prev) => {
      const next = { ...prev, [key]: clamp(key, value) }
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        } catch {
          // 保存失敗は無視(次回デフォルトに戻るだけ)
        }
      }, 300)
      return next
    })
  }, [])

  return { sizes, update }
}

/**
 * リサイズバーのドラッグ処理。
 * onDrag には pointerdown 時点からの移動量(px)ではなく現在のポインタ座標を渡す。
 */
export function startResize(
  e: React.PointerEvent,
  axis: 'x' | 'y',
  initial: number,
  direction: 1 | -1,
  onResize: (value: number) => void,
): void {
  e.preventDefault()
  const startPos = axis === 'x' ? e.clientX : e.clientY

  const onMove = (ev: PointerEvent) => {
    const pos = axis === 'x' ? ev.clientX : ev.clientY
    onResize(initial + (pos - startPos) * direction)
  }
  const onUp = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  document.body.style.cursor = axis === 'x' ? 'col-resize' : 'row-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}
