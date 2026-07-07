import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastState {
  toasts: Toast[]
  showToast: (message: string, type?: ToastType) => void
  dismissToast: (id: string) => void
}

let toastCounter = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  showToast: (message, type = 'info') => {
    const id = `toast-${++toastCounter}`
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 3000)
  },
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))
