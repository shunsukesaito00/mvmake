/** プレビュー・書き出しの音声ミックス経路 */
export const AUDIO_MIX_RENDER_PATHS = {
  preview: {
    entry: 'AudioEngine.play → scheduleClip',
    chain: 'noiseReduction → EQ → scheduleVolumeAutomation → applyDucking',
    duckingIntervals: 'getDuckingIntervals',
    clipEnum: 'getAudioClipsFromProject',
  },
  export: {
    entry: 'exporter.exportProject → mixAudioOffline',
    chain: 'noiseReduction → EQ → scheduleVolumeAutomation → applyDucking',
    slice: 'audioSampleOffset = floor(startTime * sampleRate)',
  },
} as const

export const AUDIO_SIGNAL_CHAIN = [
  'connectNoiseReductionChain',
  'connectEqChain',
  'scheduleVolumeAutomation',
  'applyDucking',
] as const

/** 章 In/Out 書き出し時のオーディオサンプル範囲（exporter と同一式） */
export function getExportAudioSampleRange(
  startTime: number,
  duration: number,
  sampleRate: number,
  bufferLength: number,
): { audioSampleOffset: number; audioEndSample: number } {
  const audioSampleOffset = Math.floor(startTime * sampleRate)
  const audioEndSample = Math.min(Math.floor((startTime + duration) * sampleRate), bufferLength)
  return { audioSampleOffset, audioEndSample }
}

export function audioEngineUsesSharedMixChain(source: string): boolean {
  return AUDIO_SIGNAL_CHAIN.every((fn) => source.includes(fn))
}
