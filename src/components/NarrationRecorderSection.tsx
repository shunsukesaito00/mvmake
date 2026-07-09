import { useEffect, useRef, useState } from 'react'
import { useProjectStore } from '../store/projectStore'
import { useToastStore } from '../store/toastStore'
import { Btn } from './ui'
import { Icons } from './icons'
import {
  buildRecordingBlob,
  formatNarrationFileName,
  formatRecordingDuration,
  isNarrationRecordingSupported,
  NARRATION_MIN_DURATION_SEC,
  pickRecorderMimeType,
} from '../utils/narrationRecording'
import { createAudioAssetFromBlob } from '../engine/mediaLoader'

type RecorderPhase = 'idle' | 'recording' | 'preview'

export function NarrationRecorderSection() {
  const [phase, setPhase] = useState<RecorderPhase>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)
  const [previewDuration, setPreviewDuration] = useState(0)
  const [isPlacing, setIsPlacing] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const mimeTypeRef = useRef('audio/webm')
  const startedAtRef = useRef(0)
  const timerRef = useRef<number | null>(null)

  const addMediaAsset = useProjectStore((s) => s.addMediaAsset)
  const addClipFromMedia = useProjectStore((s) => s.addClipFromMedia)
  const currentTime = useProjectStore((s) => s.currentTime)
  const showToast = useToastStore((s) => s.showToast)

  const supported = isNarrationRecordingSupported()

  const clearPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setPreviewBlob(null)
    setPreviewDuration(0)
  }

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  const resetToIdle = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    mediaRecorderRef.current = null
    chunksRef.current = []
    stopStream()
    clearPreview()
    setElapsed(0)
    setPhase('idle')
  }

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current)
    stopStream()
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const handleStart = async () => {
    if (!supported) {
      showToast('このブラウザではマイク録音に対応していません', 'error')
      return
    }

    try {
      clearPreview()
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = pickRecorderMimeType() ?? 'audio/webm'
      mimeTypeRef.current = mimeType
      const recorder = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      recorder.onstop = () => {
        stopStream()
        const blob = buildRecordingBlob(chunksRef.current, mimeTypeRef.current)
        const duration = Math.max(0, (Date.now() - startedAtRef.current) / 1000)
        if (duration < NARRATION_MIN_DURATION_SEC) {
          showToast('録音が短すぎます。もう一度録音してください', 'error')
          resetToIdle()
          return
        }
        const url = URL.createObjectURL(blob)
        setPreviewBlob(blob)
        setPreviewUrl(url)
        setPreviewDuration(duration)
        setPhase('preview')
        if (timerRef.current !== null) {
          window.clearInterval(timerRef.current)
          timerRef.current = null
        }
      }

      recorder.onerror = () => {
        showToast('録音中にエラーが発生しました', 'error')
        resetToIdle()
      }

      mediaRecorderRef.current = recorder
      startedAtRef.current = Date.now()
      setElapsed(0)
      setPhase('recording')
      recorder.start(200)
      timerRef.current = window.setInterval(() => {
        setElapsed((Date.now() - startedAtRef.current) / 1000)
      }, 100)
    } catch {
      stopStream()
      showToast('マイクへのアクセスが拒否されました', 'error')
      resetToIdle()
    }
  }

  const handleStop = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  const handlePlace = async () => {
    if (!previewBlob || previewDuration < NARRATION_MIN_DURATION_SEC) return
    setIsPlacing(true)
    try {
      const name = formatNarrationFileName()
      const asset = await createAudioAssetFromBlob(previewBlob, name, previewDuration)
      if (!asset) {
        showToast('録音データの読み込みに失敗しました', 'error')
        return
      }
      addMediaAsset(asset)
      const placed = addClipFromMedia(asset.id, undefined, currentTime)
      if (!placed) {
        showToast('BGM トラックに配置できませんでした', 'error')
        return
      }
      showToast('ナレーションをタイムラインに配置しました', 'success')
      resetToIdle()
    } catch {
      showToast('ナレーションの配置に失敗しました', 'error')
    } finally {
      setIsPlacing(false)
    }
  }

  if (!supported) {
    return (
      <div className="mx-3 mb-2 rounded-xl bg-surface-3 px-3 py-2.5 ring-1 ring-border">
        <p className="text-[10px] text-text-muted">このブラウザではマイク録音に対応していません</p>
      </div>
    )
  }

  return (
    <div className="mx-3 mb-2 space-y-2 rounded-xl bg-surface-3 px-3 py-3 ring-1 ring-border">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-muted text-accent">
          <Icons.Mic size={14} />
        </span>
        <div>
          <p className="text-xs font-medium text-text-primary">ナレーション録音</p>
          <p className="text-[10px] text-text-muted">マイク入力を BGM トラックへ配置</p>
        </div>
      </div>

      {phase === 'idle' && (
        <Btn variant="accent" className="w-full text-xs" onClick={handleStart}>
          録音を開始
        </Btn>
      )}

      {phase === 'recording' && (
        <div className="space-y-2">
          <p className="text-center font-mono text-sm text-accent">
            録音中 {formatRecordingDuration(elapsed)}
          </p>
          <Btn variant="danger" className="w-full text-xs" onClick={handleStop}>
            録音を停止
          </Btn>
        </div>
      )}

      {phase === 'preview' && previewUrl && (
        <div className="space-y-2">
          <audio controls src={previewUrl} className="w-full" aria-label="録音プレビュー" />
          <p className="text-center text-[10px] text-text-muted">
            長さ: {formatRecordingDuration(previewDuration)}
          </p>
          <div className="flex gap-2">
            <Btn variant="ghost" className="flex-1 text-xs" onClick={resetToIdle}>
              やり直す
            </Btn>
            <Btn
              variant="accent"
              className="flex-1 text-xs"
              disabled={isPlacing}
              onClick={handlePlace}
            >
              タイムラインに配置
            </Btn>
          </div>
        </div>
      )}
    </div>
  )
}
