# 音量キーフレーム監査（v2.0.1）

最終更新: 2026-07-11（v2.0.1 / MVP 本番品質化）

## 目的

AudioClip / VideoClip の**クリップ内音量キーフレーム**について、線形補間・書き出し自動化（`scheduleVolumeAutomation`）・分割再配分・undo が破綻しないことを本番品質として回帰監視する。

タイムライン UI レーンは [VOLUME_KEYFRAME_TIMELINE_AUDIT.md](./VOLUME_KEYFRAME_TIMELINE_AUDIT.md)（v2.0.0）。音量正規化との連動は [AUDIO_NORMALIZE_AUDIT.md](./AUDIO_NORMALIZE_AUDIT.md)（v1.93.0）を参照。

## 処理経路

```
VolumeKeyframesSection / TimelinePanel
  → updateClip({ audio: { volumeKeyframes } }, recordHistory?)
  → getVolumeAtLocalTime（プレビュー/書き出し補間）
  → scheduleVolumeAutomation（Web Audio GainNode）
  → splitVolumeKeyframes（splitClipAt 連動）
```

## ストレス構成（v2.0.1）

| クリップ | キーフレーム | duration | 検証 |
|---------|-------------|----------|------|
| 音声 BGM | **4 本**（0 / 1 / 4.5 / 6s） | 6s | 中間 0.5s ≈ 0.3 |
| 動画音声 | **2 本**（0 / 3s） | 6s | 中間 1.5s ≈ 0.6 |
| 分割 | **3s** で **2+2** 再配分 | — | splitClipAt |

## エッジケース

| ケース | 挙動 |
|--------|------|
| **キーフレームなし** | `audio.volume` 定数 + fadeIn/Out |
| **1 点 KF** | 全区間でその音量 |
| **境界** | localTime < 0 / > duration は端点音量でクランプ |
| **分割境界** | split 時刻の KF は両クリップに複製 |
| **変更 undo** | `updateClip(recordHistory=true)` |
| **正規化** | 全 KF を同倍率スケール（v1.93.0） |

## ストレステスト

| 項目 | 値 |
|------|-----|
| クリップ | **2**（音声 + 動画） |
| 投入 | `seedVolumeKeyframeStress()` / `loadVolumeKeyframeStress` |
| 検証 | `getVolumeAtClipLocalTime` / `getVolumeKeyframeSplitCounts` / `countVolumeAutomationEvents` |

E2E プレビューは `vite build --mode e2e`（`.env.e2e`）で `window.__FABLE_E2E__` を有効化。

## 自動検証

| テスト | 内容 |
|--------|------|
| `volumeKeyframes.test.ts` | 補間・ソート |
| `volumeKeyframesTimeline.test.ts` | 分割再配分 |
| `audioMixRegression.test.ts` | scheduleVolumeAutomation |
| `volumeKeyframeStressSetup.test.ts` | seed・補間・自動化・分割・undo |
| E2E | ストレス補間・分割2+2・undo（既存: インスペクター/タイムライン/正規化） |

## 関連ファイル

- `src/utils/volumeKeyframes.ts`
- `src/utils/volumeKeyframesTimeline.ts`
- `src/utils/volumeKeyframeStressSetup.ts`
- `src/engine/audioEngine.ts`
- `src/store/projectStore.ts` — `splitClipAt`
- `src/e2eBridge.ts`

## 既知の許容差分

| 項目 | 内容 |
|------|------|
| 補間 | 線形のみ（イージングなし） |
| 音量上限 | 0〜2（タイムライン・インスペクター共通） |
| タイムライン UI | v2.0.0 で別監査（レーン表示・ドラッグ） |
