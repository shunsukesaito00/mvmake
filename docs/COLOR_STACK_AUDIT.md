# 色調スタック監査（Q5）

最終更新: 2026-07-11（v1.73.0 / Phase B Q5）

## 結論

**本編プレビューと MP4 書き出しは `compositor.drawMediaClip` 内の同一色調スタック**を通る。LUT・ルック（`ColorAdjustments`）・トーン/RGB カーブ・色温度/ティント・調整レイヤーはすべてこの経路で合成される。

## 適用順（本編）

| 段階 | 処理 | モジュール |
|------|------|------------|
| 1 | 上位調整レイヤーの色調を加算合成 | `getAdjustmentColorForVisualTrack` → `mergeClipColorWithAdjustment` |
| 2 | LUT 解決（クリップ優先、なければ最上位調整レイヤー） | `getAdjustmentLutForVisualTrack` → `resolveClipLut` |
| 3 | ピクセルスタック（LUT → トーン → RGB → 色温度/ティント） | `applyCompositorColorStackToImageData` |
| 4 | CSS filter（色相・明るさ・コントラスト・彩度） | `applyColorFilter` / `buildColorFilterCss` |

自動検証: `src/utils/colorStackRegression.test.ts`（複合スタック・極端値・調整レイヤー合成）

## 調整レイヤーの合成ルール

| 属性 | ルール |
|------|--------|
| 色調（brightness 等） | 対象トラックより**上**の全調整レイヤーを**加算** |
| RGB カーブ | チャンネルごとに制御点をマージ（`mergeRgbCurves`） |
| LUT | **最上位**の調整レイヤー 1 件（クリップに LUT があればクリップ優先） |

## プレビュー / 書き出し / ミニプレビュー

| 経路 | 色調スタック | 備考 |
|------|--------------|------|
| 本編プレビュー | compositor 完全スタック | `renderFrame` 共有 |
| MP4 書き出し | compositor 完全スタック | 同上 |
| ルックミニプレビュー | ピクセルグレード + CSS（**LUT なし**） | 参照 UI |
| LUT ミニプレビュー | LUT + ピクセルグレード + CSS | 参照 UI |

ミニプレビューはインスペクター上の試聴用。複合スタックの WYSIWYG は本編プレビュー・書き出しが正本。

## 既知の仕様（本番品質として文書化）

- **色相（hue）** は CSS `hue-rotate` のみ。色温度・ティントはピクセル処理
- **テキストクリップ** は調整レイヤーの CSS filter のみ（クリップ個別 LUT 非対応）
- **ベジェ補間** は RGB カーブのみ（トーンカーブはゾーン重み付け加算）

## 関連ファイル

- `src/utils/colorPixelGrade.ts` — `applyCompositorColorStackToImageData`
- `src/utils/colorAdjustments.ts` — 調整レイヤー色調合成
- `src/utils/lutResolve.ts` — LUT 解決
- `src/engine/compositor.ts` — 描画正本
- `docs/RENDER_PATH_AUDIT.md` — プレビュー/書き出し経路監査
