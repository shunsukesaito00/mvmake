# BGM/ナレーション音量正規化監査（v1.93.0）

最終更新: 2026-07-11（v1.93.0 / MVP 本番品質化）

## 目的

インスペクターの**音量を正規化**について、素材ピークを約 90% に合わせて `volume` / `volumeKeyframes` を同倍率スケールする処理が、BGM・ナレーション・キーフレーム付きクリップでも破綻しないことを本番品質として回帰監視する。

初回実装は v1.13.0。プレビュー/書き出しのオーディオチェーン整合は [AUDIO_STACK_AUDIT.md](./AUDIO_STACK_AUDIT.md)（v1.74.0）を参照。

## 処理経路

```
AudioNormalizeSection（InspectorPanel / オーディオ・動画音声）
  → normalizeAudioSettingsFromBlob（audioNormalize.ts）
    → decodeAudioBlob → measurePeakAmplitude（sourceStart/sourceDuration 区間）
    → computeNormalizeMultiplier（目標 0.9・MAX 2 クランプ）
    → applyVolumeNormalizeToAudio（volume + volumeKeyframes 同倍率）
  → updateClip(..., { audio }, recordHistory=true)
```

## 正規化ルール（v1.93.0）

| 項目 | 内容 |
|------|------|
| **目標ピーク** | `DEFAULT_NORMALIZE_TARGET_PEAK` = **0.9** |
| **音量上限** | `MAX_AUDIO_VOLUME` = **2** |
| **倍率** | `min(MAX / effectivePeak, target / measuredPeak)` |
| **effectivePeak** | `max(volume, volumeKeyframes[].volume)` |
| **無音** | `measuredPeak <= MIN_MEASURABLE_PEAK` なら倍率 1 |

## エッジケース

| ケース | 挙動 |
|--------|------|
| **メディア未検出** | `メディアが見つかりません` |
| **デコード失敗** | `音声の解析に失敗しました` |
| **すでに目標付近** | 倍率 1・toast に「目標ピーク付近」 |
| **キーフレームあり** | 全 KF を同倍率でスケール（上限 2） |
| **ソース区間** | `sourceStart` / `sourceDuration` 内のみピーク計測 |
| **undo** | `updateClip` の `recordHistory=true` で復元 |

## ストレステスト

| 項目 | 値 |
|------|-----|
| クリップ数 | **3 件**（`AUDIO_NORMALIZE_STRESS_CLIP_COUNT`） |
| BGM | `stress-bgm.wav` ピーク **0.1** / volume 1 |
| ナレーション | `stress-narration.wav` ピーク **0.05** / volume 0.75 |
| KF 付き BGM | `stress-bgm-kf.wav` ピーク **0.2** / volume 0.5 + KF 0.3/0.8 |
| 投入 | `seedAudioNormalizeStress()` / `loadAudioNormalizeStress` |

E2E プレビューは `vite build --mode e2e`（`.env.e2e`）で `window.__FABLE_E2E__` を有効化。

## 自動検証

| テスト | 内容 |
|--------|------|
| `audioNormalize.test.ts` | ピーク計測・倍率・KF 同倍率・上限・区間・無音 |
| `audioNormalizeStressSetup.test.ts` | 3クリップ seed・undo 復元 |
| E2E | undo・KF スケール・BGM/ナレーション順次正規化（既存: 低ピーク BGM スモーク） |

## 関連ファイル

- `src/utils/audioNormalize.ts`
- `src/utils/audioNormalizeStressSetup.ts`
- `src/utils/wavFixtures.ts`
- `src/components/AudioNormalizeSection.tsx`
- `src/panels/InspectorPanel.tsx`
- `src/store/projectStore.ts`
- `src/e2eBridge.ts`

## 既知の許容差分

| 項目 | 内容 |
|------|------|
| 対象クリップ | AudioClip / VideoClip のインスペクターのみ（一括正規化なし） |
| ピーク計測 | 素材 Blob のデコード結果に依存（極端に短い素材は計測誤差あり） |
| 書き出し検証 | 本監査は UI/ストア回帰中心。ミックス経路は AUDIO_STACK_AUDIT |
