# プレビュー / 書き出し 描画経路監査

最終更新: 2026-07-11（v1.71.0 / Phase A Q3）

## 結論

**本編プレビューと MP4 書き出しは `compositor.renderFrame` を共有**しており、トランジション・カラールック・LUT・映像フェードの本編描画に経路分岐はない。

| 経路 | エントリ | 描画エンジン | 動画同期 |
|------|----------|--------------|----------|
| プレビュー | `PreviewPanel.drawAtTime` | `compositor.renderFrame` | 停止時 `seekVideosToTime` / 再生時 `syncVideosForPlayback` |
| 書き出し | `exporter.exportProject` | `compositor.renderFrame` | 毎フレーム `seekVideosToTime` |

自動検証: `src/utils/renderPathAudit.test.ts`（トランジション 29 種の switch 網羅・共有 import 確認）

## トランジション（29 種）

すべて `compositor.getTrackLayersAtTime` の `switch (clip.transition.type)` で処理。未知の型は **クロスフェードにフォールバック**（v1.71.0）。

| 分類 | 種別 | 実装箇所 |
|------|------|----------|
| 不透明度のみ | crossfade, dissolve, fadeBlack | switch の opacity 合成 |
| キャンバスオーバーレイ | wipe, fadeWhite, fadeWarm, lightLeak, crossDissolveWarm, filmBurn, petalFall, goldenShimmer, softWipe, candleGlow, paperConfetti, silkFade, starlight, laceReveal, pearlShimmer, mistFade, ribbonCut, iris | `renderFrame` ループ内のグラデーション/マスク |
| 変形 | zoom, softFocus, gentleZoom, silkFade, pearlShimmer, petalFall, slideLeft, slideRight, slideUp | `drawWithTransform` |
| ブラー | blur, softFocus, dreamyBlur, mistFade | `drawMediaClip` の `ctx.filter` blur |

> **UI のみ**: 効果タブの `TransitionPreview` は CSS アニメーション。書き出し・本編プレビューとは別経路。

## カラールック / LUT

| 用途 | 経路 | 書き出しと一致 |
|------|------|----------------|
| 本編プレビュー・書き出し | `drawMediaClip` → LUT → ピクセルグレード → `ctx.filter` | **一致** |
| ルックミニプレビュー | `renderColorGradePreviewCanvas`（ピクセルグレード + CSS filter） | 参照 UI（静止画サムネ） |
| LUT ミニプレビュー | `lutPreview.ts` | 参照 UI |

ルックプリセット適用値は `mergeClipColorWithAdjustment` / `resolveClipLut` 経由で compositor に渡る。

## 映像フェード（fadeIn / fadeOut）

| 経路 | 関数 |
|------|------|
| compositor | `getMediaVisualOpacityAtTime`（`visualFade.ts`） |
| ルックミニプレビュー | `getColorLookPreviewOpacity` → 同一 `getVisualFadeMultiplier` |

## 既知の意図的差分

| 項目 | プレビュー | 書き出し |
|------|------------|----------|
| セーフエリア | `showSafeAreas` で描画可 | 非表示 |
| 再生中の動画シーク | `playing: true` で `renderFrame` 内シーク省略 | 毎フレーム `seekVideosToTime` |
| ミニプレビュー | CSS / 縮小 Canvas | 対象外 |

## 関連ファイル

- `src/engine/compositor.ts` — 描画正本
- `src/engine/exporter.ts` — 書き出しループ
- `src/panels/PreviewPanel.tsx` — プレビュー
- `src/utils/renderPathAudit.ts` — 監査用定数・ヘルパー
