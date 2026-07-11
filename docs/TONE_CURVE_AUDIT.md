# トーンカーブ監査（v2.0.3）

最終更新: 2026-07-11（v2.0.3 / MVP 本番品質化）

## 目的

**シャドウ・ミッドトーン・ハイライト**のゾーン重み付けトーンカーブと、**RGB 各チャンネルの可変制御点（PCHIP 補間）**について、インスペクター設定・プレビュー・書き出し（compositor ピクセルグレード）が破綻しないことを本番品質として回帰監視する。

色調スタック全体は [COLOR_STACK_AUDIT.md](./COLOR_STACK_AUDIT.md)（v1.73.0）。今回はトーン/RGB カーブ本体の卒業。

## 処理経路

```
ColorAdjustmentsSection / RgbCurvesSection
  → updateClip({ color }, recordHistory?)
  → compositor.drawMediaClip
    → applyCompositorColorStackToImageData
      → applyPixelToneCurveAdjustments（ゾーン重み）
      → applyPixelRgbCurveAdjustments（PCHIP lookup）
```

## ストレス構成（v2.0.3）

| 項目 | 値 | 検証 |
|------|-----|------|
| クリップ | 画像 1 枚（5s） | `stress-tone-curve.png` |
| シャドウ | **0.15** | `isPixelToneCurveActive` |
| ミッドトーン | **0.2** | 中間グレー 128 の R/G/B 持ち上げ |
| RGB R 50% | **0.65** | `sampleRgbCurve(r, 0.5)` ≈ 0.65 |
| ピクセル | gray **128** | R > 128、G/B もトーンで上昇 |

## エッジケース

| ケース | 挙動 |
|--------|------|
| **全ゼロ + identity RGB** | ピクセルグレードスキップ |
| **トーンのみ** | 輝度ゾーン重みで加算（`TONE_AMPLITUDE=72`） |
| **RGB のみ** | チャンネル別 lookup テーブル |
| **複合** | トーン → RGB の順（`colorPixelGrade.ts`） |
| **PCHIP** | 単調性維持、端点クランプ |
| **undo** | `updateClip(recordHistory=true)` |

## ストレステスト

| 項目 | 値 |
|------|-----|
| クリップ | **1**（画像） |
| 投入 | `seedToneCurveStress()` / `loadToneCurveStress` |
| 操作 | `applyClipColor` / `applyClipRgbCurvePoint` |
| 検証 | `getClipPixelGradeSample` / `getRgbCurveSampleAt` |

E2E プレビューは `vite build --mode e2e`（`.env.e2e`）で `window.__FABLE_E2E__` を有効化。

## 自動検証

| テスト | 内容 |
|--------|------|
| `colorToneCurve.test.ts` | ゾーン重み・ピクセル適用 |
| `colorRgbCurve.test.ts` | PCHIP・制御点追加/削除 |
| `colorStackRegression.test.ts` | compositor スタック順序 |
| `toneCurveStressSetup.test.ts` | seed・PCHIP・ピクセル・RGB・undo |
| E2E | ストレス投入・ミッドトーン変更・RGB undo（既存: インスペクター UI スモーク） |

## 関連ファイル

- `src/utils/colorToneCurve.ts`
- `src/utils/colorRgbCurve.ts`
- `src/utils/colorPixelGrade.ts`
- `src/utils/toneCurveStressSetup.ts`
- `src/components/ColorAdjustmentsSection.tsx`
- `src/engine/compositor.ts`
- `src/e2eBridge.ts`

## 既知の許容差分

| 項目 | 内容 |
|------|------|
| ルックミニプレビュー | LUT なし CSS 併用（参照 UI） |
| 色相 | CSS `hue-rotate` のみ（トーン/RGB とは別経路） |
| 制御点数 | 最大 5 点/チャンネル |
