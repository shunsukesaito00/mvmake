import { useEffect, useRef, useCallback } from 'react'
import { useProjectStore } from '../store/projectStore'
import { audioEngine } from '../engine/audioEngine'
import { preloadMedia, syncVideosForPlayback, pauseAllVideos } from '../engine/compositor'
import { computeShuttleTimelineTime, type PlaybackShuttleRate } from '../utils/playbackShuttle'

export type PlaybackControls = {
  togglePlay: () => void
  seek: (time: number) => void
  subscribeFrame: (listener: () => void) => () => void
}

interface PlaybackAnchor {
  timelineTime: number
  wallMs: number
  rate: PlaybackShuttleRate
}

export function usePlayback(): PlaybackControls {
  const project = useProjectStore((s) => s.project)
  const isPlaying = useProjectStore((s) => s.isPlaying)
  const loopPlayback = useProjectStore((s) => s.loopPlayback)
  const playbackShuttleRate = useProjectStore((s) => s.playbackShuttleRate)
  const setIsPlaying = useProjectStore((s) => s.setIsPlaying)
  const setCurrentTime = useProjectStore((s) => s.setCurrentTime)
  const setPlaybackShuttleRate = useProjectStore((s) => s.setPlaybackShuttleRate)
  const getPlaybackRange = useProjectStore((s) => s.getPlaybackRange)

  const rafRef = useRef<number>(0)
  const playingRef = useRef(isPlaying)
  const projectRef = useRef(project)
  const loopRef = useRef(loopPlayback)
  const shuttleRateRef = useRef(playbackShuttleRate)
  const anchorRef = useRef<PlaybackAnchor>({ timelineTime: 0, wallMs: 0, rate: 1 })
  const frameListenersRef = useRef(new Set<() => void>())

  useEffect(() => {
    projectRef.current = project
    preloadMedia(project)
  }, [project])

  useEffect(() => { playingRef.current = isPlaying }, [isPlaying])
  useEffect(() => { loopRef.current = loopPlayback }, [loopPlayback])
  useEffect(() => { shuttleRateRef.current = playbackShuttleRate }, [playbackShuttleRate])

  const notifyFrame = useCallback(() => {
    for (const listener of frameListenersRef.current) listener()
  }, [])

  const subscribeFrame = useCallback((listener: () => void) => {
    frameListenersRef.current.add(listener)
    return () => { frameListenersRef.current.delete(listener) }
  }, [])

  const resetAnchor = useCallback((timelineTime: number, rate: PlaybackShuttleRate) => {
    anchorRef.current = { timelineTime, wallMs: performance.now(), rate }
  }, [])

  const getAnchoredTime = useCallback(() => {
    const anchor = anchorRef.current
    return computeShuttleTimelineTime(anchor.timelineTime, anchor.wallMs, anchor.rate)
  }, [])

  const stopPlayback = useCallback((time: number) => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = 0
    audioEngine.pause(time)
    pauseAllVideos(projectRef.current)
    syncVideosForPlayback(projectRef.current, time, false)
    resetAnchor(time, 1)
  }, [resetAnchor])

  const tick = useCallback(() => {
    if (!playingRef.current) return

    const { start, end } = getPlaybackRange()
    const time = getAnchoredTime()

    if (time >= end) {
      if (loopRef.current && (useProjectStore.getState().inPoint !== null || useProjectStore.getState().outPoint !== null)) {
        if (!playingRef.current) return
        setCurrentTime(start)
        resetAnchor(start, shuttleRateRef.current)
        audioEngine.play(projectRef.current, start, shuttleRateRef.current)
        syncVideosForPlayback(projectRef.current, start, true)
        notifyFrame()
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      setIsPlaying(false)
      setPlaybackShuttleRate(1)
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
  }, [getPlaybackRange, getAnchoredTime, setCurrentTime, setIsPlaying, setPlaybackShuttleRate, notifyFrame, stopPlayback, resetAnchor])

  useEffect(() => {
    const now = useProjectStore.getState().currentTime
    if (isPlaying) {
      const { start } = getPlaybackRange()
      const from = now < start ? start : now
      resetAnchor(from, playbackShuttleRate)
      audioEngine.play(projectRef.current, from, playbackShuttleRate)
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
  }, [isPlaying, playbackShuttleRate, tick, getPlaybackRange, stopPlayback, notifyFrame, resetAnchor])

  const togglePlay = useCallback(() => {
    const { start, end } = getPlaybackRange()
    if (!isPlaying) {
      if (useProjectStore.getState().currentTime >= end) setCurrentTime(start)
      setPlaybackShuttleRate(1)
      setIsPlaying(true)
      return
    }
    setIsPlaying(false)
  }, [getPlaybackRange, isPlaying, setCurrentTime, setIsPlaying, setPlaybackShuttleRate])

  const seek = useCallback((time: number) => {
    const { end } = getPlaybackRange()
    const clamped = Math.max(0, Math.min(time, end))
    setCurrentTime(clamped)
    if (playingRef.current) {
      resetAnchor(clamped, shuttleRateRef.current)
      audioEngine.play(projectRef.current, clamped, shuttleRateRef.current)
      syncVideosForPlayback(projectRef.current, clamped, true)
    } else {
      audioEngine.pause(clamped)
      syncVideosForPlayback(projectRef.current, clamped, false)
      resetAnchor(clamped, 1)
    }
    notifyFrame()
  }, [getPlaybackRange, setCurrentTime, notifyFrame, resetAnchor])

  useEffect(() => () => audioEngine.dispose(), [])

  return { togglePlay, seek, subscribeFrame }
}
