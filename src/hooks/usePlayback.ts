import { useEffect, useRef, useCallback } from 'react'
import { useProjectStore } from '../store/projectStore'
import { audioEngine } from '../engine/audioEngine'
import { preloadMedia, syncVideosForPlayback } from '../engine/compositor'

export function usePlayback(): {
  togglePlay: () => void
  seek: (time: number) => void
} {
  // currentTime は購読しない(毎フレーム変わるため、購読すると利用側パネル全体が再レンダリングされる)
  const project = useProjectStore((s) => s.project)
  const isPlaying = useProjectStore((s) => s.isPlaying)
  const loopPlayback = useProjectStore((s) => s.loopPlayback)
  const setIsPlaying = useProjectStore((s) => s.setIsPlaying)
  const setCurrentTime = useProjectStore((s) => s.setCurrentTime)
  const getPlaybackRange = useProjectStore((s) => s.getPlaybackRange)

  const rafRef = useRef<number>(0)
  const playingRef = useRef(isPlaying)
  const projectRef = useRef(project)
  const loopRef = useRef(loopPlayback)

  useEffect(() => {
    projectRef.current = project
    preloadMedia(project)
  }, [project])

  useEffect(() => { playingRef.current = isPlaying }, [isPlaying])
  useEffect(() => { loopRef.current = loopPlayback }, [loopPlayback])

  const tick = useCallback(() => {
    const { start, end } = getPlaybackRange()
    const time = audioEngine.getCurrentTime()

    if (time >= end) {
      if (loopRef.current && (useProjectStore.getState().inPoint !== null || useProjectStore.getState().outPoint !== null)) {
        setCurrentTime(start)
        audioEngine.play(projectRef.current, start)
        syncVideosForPlayback(projectRef.current, start, true)
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      setIsPlaying(false)
      setCurrentTime(start)
      audioEngine.stop()
      syncVideosForPlayback(projectRef.current, start, false)
      return
    }

    setCurrentTime(time)
    syncVideosForPlayback(projectRef.current, time, true)
    rafRef.current = requestAnimationFrame(tick)
  }, [getPlaybackRange, setCurrentTime, setIsPlaying])

  useEffect(() => {
    const now = useProjectStore.getState().currentTime
    if (isPlaying) {
      const { start } = getPlaybackRange()
      const from = now < start ? start : now
      audioEngine.play(projectRef.current, from)
      syncVideosForPlayback(projectRef.current, from, true)
      rafRef.current = requestAnimationFrame(tick)
    } else {
      cancelAnimationFrame(rafRef.current)
      audioEngine.pause(now)
      syncVideosForPlayback(projectRef.current, now, false)
    }
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying, tick, getPlaybackRange])

  const togglePlay = useCallback(() => {
    const { start, end } = getPlaybackRange()
    if (useProjectStore.getState().currentTime >= end) setCurrentTime(start)
    setIsPlaying(!isPlaying)
  }, [getPlaybackRange, isPlaying, setCurrentTime, setIsPlaying])

  const seek = useCallback((time: number) => {
    const { end } = getPlaybackRange()
    const clamped = Math.max(0, Math.min(time, end))
    setCurrentTime(clamped)
    if (playingRef.current) {
      audioEngine.play(projectRef.current, clamped)
      syncVideosForPlayback(projectRef.current, clamped, true)
    } else {
      audioEngine.pause(clamped)
      syncVideosForPlayback(projectRef.current, clamped, false)
    }
  }, [getPlaybackRange, setCurrentTime])

  useEffect(() => () => audioEngine.dispose(), [])

  return { togglePlay, seek }
}
