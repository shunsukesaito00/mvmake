import { useEffect, useRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  variant?: 'default' | 'accent' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  tooltip?: string
}

const sizeClasses = { sm: 'h-7 w-7', md: 'h-8 w-8', lg: 'h-10 w-10' }
const variantClasses = {
  default: 'bg-surface-3 text-text-secondary hover:bg-surface-4 hover:text-text-primary',
  accent: 'bg-accent text-surface-0 hover:bg-accent-hover',
  ghost: 'bg-transparent text-text-secondary hover:bg-surface-3 hover:text-text-primary',
  danger: 'bg-transparent text-red-400 hover:bg-red-400/10',
}

export function IconButton({ active, variant = 'ghost', size = 'md', tooltip, className = '', children, ...props }: IconButtonProps) {
  return (
    <button
      title={tooltip}
      aria-label={tooltip}
      className={`inline-flex items-center justify-center rounded-lg transition-all duration-150 disabled:opacity-30 disabled:pointer-events-none ${sizeClasses[size]} ${active ? 'bg-accent-muted text-accent ring-1 ring-accent/30' : variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function PanelHeader({ title, children, icon }: { title: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex h-9 shrink-0 items-center justify-between border-b border-border px-3">
      <div className="flex items-center gap-2">
        {icon && <span className="text-text-muted">{icon}</span>}
        <span className="text-xs font-semibold tracking-wide text-text-secondary uppercase">{title}</span>
      </div>
      {children && <div className="flex items-center gap-1">{children}</div>}
    </div>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-semibold tracking-wider text-accent uppercase">{children}</p>
}

export function Slider({ label, value, min, max, step, onChange, format }: {
  label: string; value: number; min: number; max: number; step: number
  onChange: (v: number) => void; format?: (v: number) => string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between">
        <span className="text-[11px] text-text-secondary">{label}</span>
        <span className="text-[11px] tabular-nums text-text-muted">{format ? format(value) : value.toFixed(2)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full" />
    </div>
  )
}

function getFocusableElements(root: HTMLElement | null): HTMLElement[] {
  if (!root) return []
  return Array.from(
    root.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
  ).filter((el) => !el.hasAttribute('disabled'))
}

export function Modal({ open, onClose, title, children, width = 'w-96' }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; width?: string
}) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // 開いたら最初の要素へフォーカスを移し、閉じたら元の位置へ戻す
  // (依存は open のみ: 親の再レンダリングでフォーカスを奪い直さないため)
  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    getFocusableElements(dialogRef.current)[0]?.focus()
    return () => previouslyFocused?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      // Tab 循環をモーダル内に閉じ込める
      if (e.key === 'Tab') {
        const focusable = getFocusableElements(dialogRef.current)
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        const active = document.activeElement
        const inside = dialogRef.current?.contains(active) ?? false
        if (e.shiftKey && (active === first || !inside)) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && (active === last || !inside)) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`${width} rounded-2xl border border-border bg-surface-2 p-6 shadow-2xl shadow-black/40 animate-fade-in`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-5 text-base font-bold text-text-primary">{title}</h2>
        {children}
      </div>
    </div>
  )
}

export function Btn({ variant = 'default', className = '', children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'accent' | 'danger' | 'ghost' }) {
  const variants = {
    default: 'bg-surface-3 text-text-primary hover:bg-surface-4 border border-border',
    accent: 'bg-accent text-surface-0 hover:bg-accent-hover font-semibold',
    danger: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20',
    ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-3',
  }
  return (
    <button className={`rounded-lg px-4 py-2 text-sm transition-all duration-150 disabled:opacity-40 ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function EmptyState({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-3 text-text-muted">{icon}</div>
      <div>
        <p className="text-sm font-medium text-text-secondary">{title}</p>
        <p className="mt-1 text-xs text-text-muted">{description}</p>
      </div>
    </div>
  )
}

export function Timecode({ current, total, fps }: { current: number; total: number; fps: number }) {
  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    const fr = Math.floor((s % 1) * fps)
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}:${fr.toString().padStart(2, '0')}`
  }
  return (
    <div className="flex items-center gap-1 font-mono text-xs">
      <span className="tabular-nums text-accent">{fmt(current)}</span>
      <span className="text-text-muted">/</span>
      <span className="tabular-nums text-text-muted">{fmt(total)}</span>
    </div>
  )
}

export function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-surface-4">
      <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-hover transition-all duration-300" style={{ width: `${progress * 100}%` }} />
    </div>
  )
}
