# プレビュー / 書き出し 描画経路監査

最終更新: 2026-07-13（v3.11.0 / ネイティブ動画デコード）

## 結論

**本編プレビューと MP4 書き出しは `compositor.renderFrame` を共有**しており、トランジション・カラールック・LUT・映像フェードの本編描画に経路分岐はない。

| 経路 | エントリ | 描画エンジン | 動画同期 |
|------|----------|--------------|----------|
| プレビュー | `PreviewPanel.drawAtTime` | `compositor.renderFrame` | 停止時 `seekVideosToTime` / 再生時 `syncVideosForPlayback`（前面クリップは `video.play` + rVFC） |
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
| 本編プレビュー・書き出し | `drawMediaClip` → `applyCompositorColorStackToImageData` → `applyColorFilter` | **一致** |
| ルックミニプレビュー | `renderColorGradePreviewCanvas`（ピクセルグレード + CSS filter） | 参照 UI（LUT なし） |
| LUT ミニプレビュー | `lutPreview.ts` | 参照 UI |

適用順・調整レイヤー合成ルールの詳細: [COLOR_STACK_AUDIT.md](./COLOR_STACK_AUDIT.md)

自動検証: `src/utils/colorStackRegression.test.ts`（複合スタック・極端値）

ルックプリセット適用値は `mergeClipColorWithAdjustment` / `resolveClipLut` 経由で compositor に渡る。

## テキスト / 字幕 / フォント

| 用途 | 経路 | 書き出しと一致 |
|------|------|----------------|
| 本編プレビュー・書き出し | `renderFrame` → `drawTextClip`（折り返し・字幕帯・アニメーション） | **一致** |
| 書き出し前のみ | `ensureProjectFontsLoaded`（カタログフォント検証・失敗時 `FontLoadError`） | 意図的差分 |

折り返し・字幕帯・SRT 往復・フォントロードの詳細: [TEXT_SRT_AUDIT.md](./TEXT_SRT_AUDIT.md)

自動検証: `src/utils/textRenderRegression.test.ts`（長文・字幕帯極端値）、`src/utils/srtRoundTrip.test.ts`

## 映像フェード（fadeIn / fadeOut）

| 経路 | 関数 |
|------|------|
| compositor | `getMediaVisualOpacityAtTime`（`visualFade.ts`） |
| ルックミニプレビュー | `getColorLookPreviewOpacity` → 同一 `getVisualFadeMultiplier` |

## 既知の意図的差分

| 項目 | プレビュー | 書き出し |
|------|------------|----------|
| セーフエリア | `showSafeAreas` で描画可 | 非表示 |
| フォントプリロード | 選択時のみ（未ロードはフォールバック表示可） | `ensureProjectFontsLoaded`（失敗時中止） |
| 再生中の動画シーク | 前面クリップは `video.play` + rVFC（v3.11.0）。背面・逆シャトルは手動シーク | 毎フレーム `seekVideosToTime` |
| ミニプレビュー | CSS / 縮小 Canvas | 対象外 |

## 関連ファイル

- `src/engine/compositor.ts` — 描画正本
- `src/engine/exporter.ts` — 書き出しループ
- `src/panels/PreviewPanel.tsx` — プレビュー
- `src/utils/renderPathAudit.ts` — 監査用定数・ヘルパー
- `src/utils/colorPixelGrade.ts` — 色調ピクセルスタック
- `docs/COLOR_STACK_AUDIT.md` — 色調スタック詳細（Q5）
- `docs/TEXT_SRT_AUDIT.md` — テキスト・SRT・フォント（Q8）
