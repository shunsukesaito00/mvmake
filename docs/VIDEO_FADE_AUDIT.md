# 映像クリップのフェードイン/アウト監査（v1.99.0）

最終更新: 2026-07-11（v1.99.0 / MVP 本番品質化）

## 目的

VideoClip / ImageClip の **fadeIn / fadeOut**（秒数指定の不透明度フェード）について、インスペクター設定・プレビュー・書き出し（compositor）で不透明度が破綻しないこと、undo・再適用で復元できることを本番品質として回帰監視する。

初回実装は v1.1.5。v1.26.0 でプレビュー/書き出し整合を改善。計算は `visualFade.ts` の `getMediaVisualOpacityAtTime` が単一経路。

## 適用経路

```
インスペクター「フェード」タブ（VisualFadeSection）
  → updateClip({ fadeIn, fadeOut }, recordHistory=true)
  → compositor.getLayerOpacityAtTime
    → getMediaVisualOpacityAtTime
      → transform 不透明度 × getVisualFadeMultiplier
```

`clampVisualFadeValues` でクリップ長の半分を超えないようクランプ（UI スライダー max も連動）。

## ストレス構成（v1.99.0）

| クリップ | fadeIn | fadeOut | duration | 検証点 |
|---------|--------|---------|----------|--------|
| 画像 | **1.0s** | **0.5s** | 5s | 開始 opacity=0、中間≈0.5 |
| 動画 | **0.5s** | **1.0s** | 6s | 終端 opacity=0、fadeIn 完了後≈1 |

## エッジケース

| ケース | 挙動 |
|--------|------|
| **フェードなし** | multiplier=1。transform のみ |
| **transform KF 併用** | transform opacity × fade multiplier |
| **境界** | fadeIn 開始=0、fadeOut 終端=0（線形） |
| **変更 undo** | updateClip(recordHistory=true) で復元 |
| **再適用** | undo 後に同値を再設定で不透明度復元 |

## ストレステスト

| 項目 | 値 |
|------|-----|
| クリップ数 | **2**（画像 + 動画） |
| 投入 | `seedVideoFadeStress()` / `loadVideoFadeStress` |
| 適用 | `applyClipFade(clipId, fadeIn, fadeOut)` |
| 検証 | `getMediaVisualOpacityForClip` / `getClipFadeValues` |

E2E プレビューは `vite build --mode e2e`（`.env.e2e`）で `window.__FABLE_E2E__` を有効化。

## 自動検証

| テスト | 内容 |
|--------|------|
| `visualFade.test.ts` | multiplier・clamp・transform 合成 |
| `videoFadeStressSetup.test.ts` | seed・undo・再適用・フェードなし |
| E2E | ストレス2クリップ/不透明度・適用undo・再適用（既存: 画像UIフェードイン） |

## 関連ファイル

- `src/utils/visualFade.ts`
- `src/utils/videoFadeStressSetup.ts`
- `src/components/VisualFadeSection.tsx`
- `src/engine/compositor.ts`
- `src/panels/InspectorPanel.tsx`
- `src/e2eBridge.ts`

## 既知の許容差分

| 項目 | 内容 |
|------|------|
| テキストアニメ fadeIn | テキスト用 `textAnimation.ts` は別経路 |
| トランジション | クリップ間トランジション opacity は別計算 |
| 音声 fade | `audio.fadeIn/Out` はミックス用（映像フェードとは別） |
