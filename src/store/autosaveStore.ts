import { create } from 'zustand'

export type AutoSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

interface AutoSaveState {
  status: AutoSaveStatus
  mediaProgress: { current: number; total: number } | null
  setPending: () => void
  setSaving: (progress?: { current: number; total: number }) => void
  setSaved: () => void
  setError: () => void
  resetToIdle: () => void
}

export const useAutoSaveStore = create<AutoSaveState>((set) => ({
  status: 'idle',
  mediaProgress: null,
  setPending: () => set({ status: 'pending', mediaProgress: null }),
  setSaving: (progress) => set({ status: 'saving', mediaProgress: progress ?? null }),
  setSaved: () => set({ status: 'saved', mediaProgress: null }),
  setError: () => set({ status: 'error', mediaProgress: null }),
  resetToIdle: () => set({ status: 'idle', mediaProgress: null }),
}))
