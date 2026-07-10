import { useEffect, useRef, useCallback } from 'react'
import { useProjectStore } from '../store/projectStore'
import { audioEngine } from '../engine/audioEngine'
import { preloadMedia, syncVideosForPlayback, pauseAllVideos } from '../engine/compositor'

export type PlaybackControls = {
  togglePlay: () => void
  seek: (time: number) => void
  subscribeFrame: (listener: () => void) => () => void
}

export function usePlayback(): PlaybackControls {
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
  const frameListenersRef = useRef(new Set<() => void>())

  useEffect(() => {
    projectRef.current = project
    preloadMedia(project)
  }, [project])

  useEffect(() => { playingRef.current = isPlaying }, [isPlaying])
  useEffect(() => { loopRef.current = loopPlayback }, [loopPlayback])

  const notifyFrame = useCallback(() => {
    for (const listener of frameListenersRef.current) listener()
  }, [])

  const subscribeFrame = useCallback((listener: () => void) => {
    frameListenersRef.current.add(listener)
    return () => { frameListenersRef.current.delete(listener) }
  }, [])

  const stopPlayback = useCallback((time: number) => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = 0
    audioEngine.pause(time)
    pauseAllVideos(projectRef.current)
    syncVideosForPlayback(projectRef.current, time, false)
  }, [])

  const tick = useCallback(() => {
    if (!playingRef.current) return

    const { start, end } = getPlaybackRange()
    const time = audioEngine.getCurrentTime()

    if (time >= end) {
      if (loopRef.current && (useProjectStore.getState().inPoint !== null || useProjectStore.getState().outPoint !== null)) {
        if (!playingRef.current) return
        setCurrentTime(start)
        audioEngine.play(projectRef.current, start)
        syncVideosForPlayback(projectRef.current, start, true)
        notifyFrame()
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      setIsPlaying(false)
      setCurrentTime(start)
      stopPlayback(start)
      notifyFrame()
      return
    }

    setCurrentTime(time)
    syncVideosForPlayback(projectRef.current, time, true)
    notifyFrame()
    if (!playingRef.current) return
    rafRef.current = requestAnimationFrame(tick)
  }, [getPlaybackRange, setCurrentTime, setIsPlaying, notifyFrame, stopPlayback])

  useEffect(() => {
    const now = useProjectStore.getState().currentTime
    if (isPlaying) {
      const { start } = getPlaybackRange()
      const from = now < start ? start : now
      audioEngine.play(projectRef.current, from)
      syncVideosForPlayback(projectRef.current, from, true)
      rafRef.current = requestAnimationFrame(tick)
    } else {
      stopPlayback(now)
      notifyFrame()
    }
    return () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
  }, [isPlaying, tick, getPlaybackRange, stopPlayback, notifyFrame])

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
    notifyFrame()
  }, [getPlaybackRange, setCurrentTime, notifyFrame])

  useEffect(() => () => audioEngine.dispose(), [])

  return { togglePlay, seek, subscribeFrame }
}
