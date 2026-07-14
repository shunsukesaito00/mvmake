export type ExportChimeOutcome = 'success' | 'partial' | 'failure'

type ToneStep = { frequency: number; durationMs: number; gapMs?: number }

const CHIME_TONES: Record<ExportChimeOutcome, ToneStep[]> = {
  success: [
    { frequency: 880, durationMs: 90 },
    { frequency: 1174, durationMs: 140, gapMs: 40 },
  ],
  partial: [
    { frequency: 740, durationMs: 100 },
    { frequency: 660, durationMs: 160, gapMs: 50 },
  ],
  failure: [
    { frequency: 420, durationMs: 180 },
    { frequency: 280, durationMs: 220, gapMs: 60 },
  ],
}

export function getExportChimeTones(outcome: ExportChimeOutcome): ToneStep[] {
  return CHIME_TONES[outcome]
}

/**
 * チャイムはタブの表示・非表示に関わらず鳴る（通知は非アクティブ時のみ）。
 * `muted` はアプリ側の明示ミュート（将来拡張）またはテスト用。
 */
export function shouldPlayExportChime(options: {
  enabled: boolean
  muted?: boolean
}): boolean {
  if (!options.enabled) return false
  if (options.muted === true) return false
  return true
}

function recordE2eChime(outcome: ExportChimeOutcome): boolean {
  const bag = (globalThis as unknown as { __FABLE_E2E_CHIMES__?: ExportChimeOutcome[] }).__FABLE_E2E_CHIMES__
  if (!Array.isArray(bag)) return false
  bag.push(outcome)
  return true
}

async function playToneSequence(tones: ToneStep[]): Promise<void> {
  const AudioCtx =
    typeof window !== 'undefined'
      ? window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      : undefined
  if (!AudioCtx) return

  const ctx = new AudioCtx()
  try {
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    let t = ctx.currentTime + 0.02
    for (const step of tones) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(step.frequency, t)
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.015)
      const end = t + step.durationMs / 1000
      gain.gain.exponentialRampToValueAtTime(0.0001, end)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t)
      osc.stop(end + 0.02)
      t = end + (step.gapMs ?? 30) / 1000
    }
    const totalMs = Math.ceil((t - ctx.currentTime) * 1000) + 80
    await new Promise((resolve) => setTimeout(resolve, totalMs))
  } finally {
    void ctx.close()
  }
}

/** @returns チャイム再生を試みたとき true */
export function playExportChime(
  outcome: ExportChimeOutcome,
  options?: { enabled?: boolean; muted?: boolean },
): boolean {
  if (!shouldPlayExportChime({
    enabled: options?.enabled === true,
    muted: options?.muted,
  })) {
    return false
  }

  if (recordE2eChime(outcome)) {
    return true
  }

  void playToneSequence(getExportChimeTones(outcome)).catch(() => {
    // Autoplay / AudioContext 失敗は無視
  })
  return true
}
