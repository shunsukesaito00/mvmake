import { useEffect, useRef, useState } from 'react'
import { createAudioAssetFromBlob } from '../engine/mediaLoader'
import { useProjectStore } from '../store/projectStore'
import { useToastStore } from '../store/toastStore'
import {
  buildNarrationFileName,
  formatRecordingElapsed,
  isNarrationRecordingSupported,
  mergeRecordedChunks,
  pickRecorderMimeType,
  type NarrationRecorderStatus,
} from '../utils/narrationRecorder'
import { Btn } from './ui'
import { Icons } from './icons'

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}

export function NarrationRecorderSection() {
  const [status, setStatus] = useState<NarrationRecorderStatus>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [isPlacing, setIsPlacing] = useState(false)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedAtRef = useRef(0)
  const timerRef = useRef<number | null>(null)

  const addMediaAsset = useProjectStore((s) => s.addMediaAsset)
  const addClipFromMedia = useProjectStore((s) => s.addClipFromMedia)
  const showToast = useToastStore((s) => s.showToast)

  const supported = isNarrationRecordingSupported()

  const clearPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setRecordedBlob(null)
  }

  const resetRecording = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    recorderRef.current = null
    stopStream(streamRef.current)
    streamRef.current = null
    chunksRef.current = []
    setElapsed(0)
    setStatus('idle')
    clearPreview()
  }

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current)
    stopStream(streamRef.current)
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
      chunksRef.current = []

      const mimeType = pickRecorderMimeType()
      const recorder = new MediaRecorder(stream, { mimeType })
      recorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      recorder.onstop = () => {
        const blob = mergeRecordedChunks(chunksRef.current)
        stopStream(streamRef.current)
        streamRef.current = null
        if (timerRef.current !== null) {
          window.clearInterval(timerRef.current)
          timerRef.current = null
        }

        if (!blob || blob.size === 0) {
          showToast('録音データが空です', 'error')
          resetRecording()
          return
        }

        const url = URL.createObjectURL(blob)
        setRecordedBlob(blob)
        setPreviewUrl(url)
        setStatus('recorded')
        setElapsed(Math.max(0, (Date.now() - startedAtRef.current) / 1000))
      }

      recorder.onerror = () => {
        showToast('録音中にエラーが発生しました', 'error')
        resetRecording()
      }

      startedAtRef.current = Date.now()
      recorder.start(250)
      setStatus('recording')
      setElapsed(0)
      timerRef.current = window.setInterval(() => {
        setElapsed((Date.now() - startedAtRef.current) / 1000)
      }, 200)
    } catch {
      showToast('マイクへのアクセスが拒否されました', 'error')
      resetRecording()
    }
  }

  const handleStop = () => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') return
    recorder.stop()
  }

  const handleDiscard = () => {
    resetRecording()
  }

  const handlePlace = async () => {
    if (!recordedBlob) return
    setIsPlacing(true)
    try {
      const name = buildNarrationFileName(recordedBlob.type)
      const asset = await createAudioAssetFromBlob(recordedBlob, name)
      if (!asset) {
        showToast('録音の読み込みに失敗しました', 'error')
        return
      }

      addMediaAsset(asset)
      const currentTime = useProjectStore.getState().currentTime
      const placed = addClipFromMedia(asset.id, undefined, currentTime)
      if (!placed) {
        showToast('BGMトラックに配置できません', 'error')
        return
      }

      showToast('ナレーションをタイムラインに配置しました', 'success')
      resetRecording()
    } catch {
      showToast('ナレーションの配置に失敗しました', 'error')
    } finally {
      setIsPlacing(false)
    }
  }

  if (!supported) {
    return (
      <div className="mx-3 mb-3 rounded-xl bg-surface-3 p-3 ring-1 ring-border">
        <p className="text-[11px] font-semibold text-text-primary">ナレーション録音</p>
        <p className="mt-1 text-[10px] text-text-muted">このブラウザではマイク録音に対応していません</p>
      </div>
    )
  }

  return (
    <div className="mx-3 mb-3 rounded-xl bg-surface-3 p-3 ring-1 ring-border">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-muted text-accent">
          <Icons.Mic size={14} />
        </span>
        <div>
          <p className="text-[11px] font-semibold text-text-primary">ナレーション録音</p>
          <p className="text-[10px] text-text-muted">マイク入力を録音して BGM トラックへ配置</p>
        </div>
      </div>

      {status === 'recording' && (
        <p className="mb-2 font-mono text-xs text-accent" aria-live="polite">
          録音中 {formatRecordingElapsed(elapsed)}
        </p>
      )}

      {status === 'recorded' && previewUrl && (
        <div className="mb-2 space-y-2">
          <p className="text-[10px] text-text-muted">プレビュー ({formatRecordingElapsed(elapsed)})</p>
          <audio controls src={previewUrl} className="w-full" aria-label="録音プレビュー" />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {status === 'idle' && (
          <Btn variant="accent" className="text-xs" onClick={handleStart}>
            録音開始
          </Btn>
        )}
        {status === 'recording' && (
          <Btn variant="danger" className="text-xs" onClick={handleStop}>
            停止
          </Btn>
        )}
        {status === 'recorded' && (
          <>
            <Btn variant="accent" className="text-xs" disabled={isPlacing} onClick={handlePlace}>
              タイムラインに配置
            </Btn>
            <Btn variant="ghost" className="text-xs" onClick={handleDiscard}>
              破棄
            </Btn>
          </>
        )}
      </div>
    </div>
  )
}
