# 音量キーフレームのタイムライン UI 監査（v2.0.0）

最終更新: 2026-07-11（v2.0.0 / MVP 本番品質化）

## 目的

タイムライン上の**音量キーフレームレーン**（波形カーブ・ハンドルドラッグ・ダブルクリック追加）について、6キーフレームストレス・分割再配分・補間音量・undo が破綻しないことを本番品質として回帰監視する。

初回実装は v1.25.0。音量KF本体は `volumeKeyframes.ts`、タイムライン UI は `VolumeKeyframesTimeline.tsx` + `TimelinePanel.tsx`。

## 適用経路

```
タイムラインクリップ選択
  → VolumeKeyframesTimeline（24px レーン）
    → buildVolumeCurvePath（線形補間カーブ）
    → ハンドル onMouseDown → startVolumeKeyframeDrag
    → SVG ダブルクリック → createVolumeKeyframeAt
  → updateClip({ audio.volumeKeyframes }, recordHistory?)
  → getVolumeAtLocalTime / scheduleVolumeAutomation（書き出し）
```

インスペクター `VolumeKeyframesSection` は別経路（数値編集）。本監査は**タイムライン UI** を主対象。

## ストレス構成（v2.0.0）

| 項目 | 値 |
|------|-----|
| クリップ | 音声 1 本（8s） |
| キーフレーム | **6 本**（0 / 1.5 / 3 / 5 / 6.5 / 8s） |
| 分割点 | **4s** → **3+3** 再配分 |
| 中間検証 | localTime **2.25s** の補間音量 |
| レーン高 | `VOLUME_TIMELINE_LANE_HEIGHT` = **24px** |

## エッジケース

| ケース | 挙動 |
|--------|------|
| **分割** | `splitVolumeKeyframes` で両側へ再配分（境界 KF は両側に複製） |
| **ドラッグ** | 時間・音量をレーン座標から更新（0〜2 倍、スナップあり） |
| **ダブルクリック** | `laneYToVolume` で音量を決定して追加 |
| **変更 undo** | `updateClip(recordHistory=true)` で復元 |
| **1KF のみ** | 水平破線ガイド表示（カーブ path なし） |

## ストレステスト

| 項目 | 値 |
|------|-----|
| 投入 | `seedVolumeKeyframeTimelineStress()` / `loadVolumeKeyframeTimelineStress` |
| 検証 | `getClipVolumeKeyframeCount` / `getVolumeAtClipLocalTime` / `listAudioClipVolumeKeyframeCounts` |
| 編集 | `updateVolumeKeyframeById(clipId, kfId, patch)` |

E2E プレビューは `vite build --mode e2e`（`.env.e2e`）で `window.__FABLE_E2E__` を有効化。

## 自動検証

| テスト | 内容 |
|--------|------|
| `volumeKeyframesTimeline.test.ts` | レーン座標・カーブ path・分割 |
| `volumeKeyframeTimelineStressSetup.test.ts` | seed・3+3分割・補間・undo・splitClipAt |
| E2E | ストレス6KF・分割3+3・undo（既存: インスペクター追加・タイムラインドラッグ） |

## 関連ファイル

- `src/utils/volumeKeyframesTimeline.ts`
- `src/utils/volumeKeyframeTimelineStressSetup.ts`
- `src/components/VolumeKeyframesTimeline.tsx`
- `src/panels/TimelinePanel.tsx`
- `src/components/VolumeKeyframesSection.tsx`
- `src/e2eBridge.ts`

## 既知の許容差分

| 項目 | 内容 |
|------|------|
| 動画クリップ | video トラックでも `clip.audio.volumeKeyframes` を共有 UI で編集 |
| トランスフォーム KF | 映像クリップは別レーン（同時表示時は bottomOffset で積層） |
| 正規化 | `audioNormalize` は KF もスケール（別監査 v1.93.0） |
