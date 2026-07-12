import { useCallback, useRef, useState } from 'react'
import {
  clampTrackHeight,
  getTrackHeight,
  loadTimelineTrackHeightSettings,
  saveTimelineTrackHeightSettings,
  type TimelineTrackHeightSettings,
} from '../persistence/timelineTrackHeights'

export function useTimelineTrackHeights(trackIds: string[]) {
  const [settings, setSettings] = useState<TimelineTrackHeightSettings>(loadTimelineTrackHeightSettings)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persist = useCallback((next: TimelineTrackHeightSettings) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveTimelineTrackHeightSettings(next)
    }, 300)
  }, [])

  const heights = trackIds.map((id) => getTrackHeight(id, settings))

  const setTrackHeight = useCallback((trackId: string, height: number) => {
    const clamped = clampTrackHeight(height)
    setSettings((prev) => {
      const next = {
        ...prev,
        byTrackId: { ...prev.byTrackId, [trackId]: clamped },
      }
      persist(next)
      return next
    })
  }, [persist])

  return { heights, setTrackHeight }
}
