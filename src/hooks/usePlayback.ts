import { useEffect, useRef, useCallback } from 'react'
import { useProjectStore } from '../store/projectStore'
import { audioEngine } from '../engine/audioEngine'
import { preloadMedia, syncVideosForPlayback, pauseAllVideos } from '../engine/compositor'
import { computeShuttleTimelineTime, isReverseShuttleRate, type PlaybackShuttleRate } from '../utils/playbackShuttle'
import { shouldSyncPlaybackUi } from '../utils/playbackUiSync'
import { setNativeVideoFrameCallback } from '../utils/nativeVideoPlayback'

export type PlaybackControls = {
  togglePlay: () => void
  seek: (time: number) => void
  subscribeFrame: (listener: () => void) => () => void
  getPlaybackTime: () => number
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
  const playbackTimeRef = useRef(0)
  const lastUiSyncMsRef = useRef(0)

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

  const getPlaybackTime = useCallback(() => {
    if (playingRef.current) return playbackTimeRef.current
    return useProjectStore.getState().currentTime
  }, [])

  const syncCurrentTimeToStore = useCallback((time: number, force = false) => {
    playbackTimeRef.current = time
    const now = performance.now()
    if (force || shouldSyncPlaybackUi(lastUiSyncMsRef.current, now)) {
      lastUiSyncMsRef.current = now
      setCurrentTime(time)
    }
  }, [setCurrentTime])

  const resetAnchor = useCallback((timelineTime: number, rate: PlaybackShuttleRate) => {
    anchorRef.current = { timelineTime, wallMs: performance.now(), rate }
    playbackTimeRef.current = timelineTime
  }, [])

  const getAnchoredTime = useCallback(() => {
    const anchor = anchorRef.current
    return computeShuttleTimelineTime(anchor.timelineTime, anchor.wallMs, anchor.rate)
  }, [])

  const startShuttlePlayback = useCallback((from: number, rate: PlaybackShuttleRate) => {
    resetAnchor(from, rate)
    lastUiSyncMsRef.current = 0
    if (isReverseShuttleRate(rate)) {
      audioEngine.pause(from)
    } else {
      audioEngine.play(projectRef.current, from, rate)
    }
    syncVideosForPlayback(projectRef.current, from, true, rate)
  }, [resetAnchor])

  const stopPlayback = useCallback((time: number) => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = 0
    audioEngine.pause(time)
    pauseAllVideos(projectRef.current)
    syncVideosForPlayback(projectRef.current, time, false, 1)
    resetAnchor(time, 1)
    playbackTimeRef.current = time
    setCurrentTime(time)
  }, [resetAnchor, setCurrentTime])

  const tick = useCallback(() => {
    if (!playingRef.current) return

    const { start, end } = getPlaybackRange()
    const time = getAnchoredTime()

    if (time >= end) {
      if (
        loopRef.current
        && shuttleRateRef.current > 0
        && (useProjectStore.getState().inPoint !== null || useProjectStore.getState().outPoint !== null)
      ) {
        if (!playingRef.current) return
        syncCurrentTimeToStore(start, true)
        startShuttlePlayback(start, shuttleRateRef.current)
        notifyFrame()
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      setIsPlaying(false)
      setPlaybackShuttleRate(1)
      stopPlayback(start)
      notifyFrame()
      return
    }

    if (time <= start) {
      setIsPlaying(false)
      setPlaybackShuttleRate(1)
      stopPlayback(start)
      notifyFrame()
      return
    }

    syncCurrentTimeToStore(time)
    syncVideosForPlayback(projectRef.current, time, true, shuttleRateRef.current)
    notifyFrame()
    if (!playingRef.current) return
    rafRef.current = requestAnimationFrame(tick)
  }, [getPlaybackRange, getAnchoredTime, syncCurrentTimeToStore, setIsPlaying, setPlaybackShuttleRate, notifyFrame, stopPlayback, startShuttlePlayback])

  useEffect(() => {
    const now = useProjectStore.getState().currentTime
    playbackTimeRef.current = now
    if (isPlaying) {
      const { start } = getPlaybackRange()
      const from = now < start ? start : now
      startShuttlePlayback(from, playbackShuttleRate)
      rafRef.current = requestAnimationFrame(tick)
    } else {
      stopPlayback(now)
      notifyFrame()
    }
    return () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
  }, [isPlaying, playbackShuttleRate, tick, getPlaybackRange, stopPlayback, notifyFrame, startShuttlePlayback])

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
    playbackTimeRef.current = clamped
    setCurrentTime(clamped)
    lastUiSyncMsRef.current = performance.now()
    if (playingRef.current) {
      startShuttlePlayback(clamped, shuttleRateRef.current)
    } else {
      audioEngine.pause(clamped)
      syncVideosForPlayback(projectRef.current, clamped, false, 1)
      resetAnchor(clamped, 1)
    }
    notifyFrame()
  }, [getPlaybackRange, setCurrentTime, notifyFrame, resetAnchor, startShuttlePlayback])

  useEffect(() => () => audioEngine.dispose(), [])

  useEffect(() => {
    setNativeVideoFrameCallback(notifyFrame)
    return () => setNativeVideoFrameCallback(null)
  }, [notifyFrame])

  return { togglePlay, seek, subscribeFrame, getPlaybackTime }
}
