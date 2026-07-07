import { useToastStore } from '../store/toastStore'
import { Icons } from './icons'

const ICONS = {
  success: <Icons.Sparkles size={16} className="text-emerald-400" />,
  error: <Icons.X size={16} className="text-red-400" />,
  info: <Icons.Help size={16} className="text-text-muted" />,
}

const STYLES = {
  success: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20',
  error: 'bg-red-500/10 text-red-300 ring-red-500/20',
  info: 'bg-surface-3 text-text-secondary ring-border',
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const dismissToast = useToastStore((s) => s.dismissToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => dismissToast(toast.id)}
          className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm shadow-xl shadow-black/30 ring-1 backdrop-blur-sm animate-fade-in ${STYLES[toast.type]}`}
        >
          {ICONS[toast.type]}
          {toast.message}
        </div>
      ))}
    </div>
  )
}
