/** 線形補間で素材区間をタイムライン長へ伸縮（ピッチ維持の簡易タイムストレッチ） */

export function stretchAudioBuffer(
  buffer: AudioBuffer,
  sourceStart: number,
  sourceDuration: number,
  targetDuration: number,
): AudioBuffer {
  const sampleRate = buffer.sampleRate
  const channels = buffer.numberOfChannels
  if (targetDuration <= 0 || sourceDuration <= 0) {
    return new AudioBuffer({ length: 1, numberOfChannels: channels, sampleRate })
  }

  const startFrame = Math.max(0, Math.floor(sourceStart * sampleRate))
  const sourceFrames = Math.max(
    1,
    Math.min(Math.floor(sourceDuration * sampleRate), buffer.length - startFrame),
  )
  const targetFrames = Math.max(1, Math.ceil(targetDuration * sampleRate))
  const stretched = new AudioBuffer({ length: targetFrames, numberOfChannels: channels, sampleRate })

  for (let ch = 0; ch < channels; ch++) {
    const src = buffer.getChannelData(ch)
    const dst = stretched.getChannelData(ch)
    const maxSrcIdx = startFrame + sourceFrames - 1
    for (let i = 0; i < targetFrames; i++) {
      const pos = (i / Math.max(1, targetFrames - 1)) * (sourceFrames - 1)
      const idx = Math.floor(pos)
      const frac = pos - idx
      const a = src[startFrame + idx] ?? 0
      const b = src[startFrame + Math.min(idx + 1, maxSrcIdx)] ?? a
      dst[i] = a + (b - a) * frac
    }
  }

  return stretched
}
