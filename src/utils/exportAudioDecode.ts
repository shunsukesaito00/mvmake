export type ExportAudioDecodeSkip = {
  assetId: string
  assetName: string
}

export function mergeExportAudioDecodeSkips(
  ...groups: ExportAudioDecodeSkip[][]
): ExportAudioDecodeSkip[] {
  const seen = new Set<string>()
  const merged: ExportAudioDecodeSkip[] = []
  for (const group of groups) {
    for (const skip of group) {
      if (seen.has(skip.assetId)) continue
      seen.add(skip.assetId)
      merged.push(skip)
    }
  }
  return merged
}

/** 書き出しで音声デコードに失敗したクリップのユーザー向けメッセージ */
export function formatExportAudioDecodeSkipMessage(skips: ExportAudioDecodeSkip[]): string | null {
  if (skips.length === 0) return null
  if (skips.length === 1) {
    return `書き出しから音声を除外しました: ${skips[0]!.assetName}（デコードに失敗）`
  }
  const names = skips.map((skip) => skip.assetName).join('、')
  return `書き出しから音声を ${skips.length} 件除外しました（デコード失敗）: ${names}`
}
