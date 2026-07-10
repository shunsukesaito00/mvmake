import { createContext, useContext, type ReactNode } from 'react'
import { usePlayback, type PlaybackControls } from '../hooks/usePlayback'

const PlaybackContext = createContext<PlaybackControls | null>(null)

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const controls = usePlayback()
  return <PlaybackContext.Provider value={controls}>{children}</PlaybackContext.Provider>
}

export function usePlaybackControls(): PlaybackControls {
  const ctx = useContext(PlaybackContext)
  if (!ctx) throw new Error('usePlaybackControls must be used within PlaybackProvider')
  return ctx
}
