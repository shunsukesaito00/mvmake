/** クリップ内ローカル時間(0〜clipDuration)での不透明度倍率。fadeIn/fadeOut は秒数 */
export function getVisualFadeMultiplier(
  localTime: number,
  clipDuration: number,
  fadeIn: number,
  fadeOut: number,
): number {
  const duration = Math.max(clipDuration, 0.001)
  const t = Math.max(0, Math.min(duration, localTime))
  let multiplier = 1

  if (fadeIn > 0 && t < fadeIn) {
    multiplier *= t / fadeIn
  }

  if (fadeOut > 0) {
    const remaining = duration - t
    if (remaining < fadeOut) {
      multiplier *= Math.max(0, remaining / fadeOut)
    }
  }

  return multiplier
}

export function clampVisualFadeValues(
  fadeIn: number,
  fadeOut: number,
  clipDuration: number,
): { fadeIn: number; fadeOut: number } {
  const maxFade = Math.max(0, clipDuration / 2)
  const inVal = Math.max(0, Math.min(maxFade, fadeIn))
  const outVal = Math.max(0, Math.min(maxFade, fadeOut))
  return { fadeIn: inVal, fadeOut: outVal }
}
