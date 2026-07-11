# トランスフォームキーフレーム監査（v1.94.0）

最終更新: 2026-07-11（v1.94.0 / MVP 本番品質化）

## 目的

映像/画像/テキストクリップの**トランスフォームキーフレーム**（位置・スケール・回転・不透明度）について、補間・ベジェ・分割再配分・タイムライン/グラフ/PreviewOverlay 経路が、婚礼向けストレス（8キーフレーム・5属性）でも破綻しないことを本番品質として回帰監視する。

分割/リップル/スリップのキーフレーム保持は [KEYFRAME_EDIT_REGRESSION.md](./KEYFRAME_EDIT_REGRESSION.md)（v1.72.0）を参照。プレビュー/書き出し経路は [RENDER_PATH_AUDIT.md](./RENDER_PATH_AUDIT.md)（v1.71.0）。

## 処理経路

```
編集 UI
  TransformKeyframesSection / TransformKeyframeGraphEditor（インスペクター）
  TransformKeyframesTimeline（タイムライン・5属性切替・全属性重ね表示・ベジェハンドル）
  PreviewOverlay（プレビュー上ドラッグ・Shift15°回転スナップ）

補間コア
  getTransformAtLocalTime（transformKeyframes.ts）
    → 線形 / easeIn|Out|InOut / ベジェ（transformKeyframeBezier.ts）
  compositor / PreviewOverlay / visualFade が同一関数を参照

分割
  splitClipAt → splitTransformKeyframes（境界 KF は両側に複製、右側 time をシフト）
```

## 属性と UI（v1.94.0）

| 属性 | タイムライン | グラフエディタ | 補間 |
|------|-------------|----------------|------|
| opacity | レーン Y | 数値直打ち | 線形・イージング・ベジェ |
| x / y | レーン Y | 数値直打ち | 同上 |
| scale | レーン Y | spinbutton | 同上 |
| rotation | レーン Y | 数値直打ち | 同上 |
| 全属性 | 重ね表示（レーン高さ拡張） | 属性タブ切替 | — |

## エッジケース

| ケース | 挙動 |
|--------|------|
| **KF なし** | ベース `transform` をそのまま使用 |
| **1点 KF** | 全区間でその値 |
| **分割** | `time < split` → 左、`time > split` → 右（time シフト）、`time === split` → 両側 |
| **ベジェ** | 属性別ハンドル。`easing: bezier` 時に有効 |
| **MG 焼き込み** | カスタム KF へ変換後は通常 KF と同経路 |

## ストレステスト

| 項目 | 値 |
|------|-----|
| クリップ | 画像 10 秒・**8 KF**（`TRANSFORM_KEYFRAME_STRESS_COUNT`） |
| 属性 | x / y / scale / rotation / opacity すべて変化 |
| 補間 | 線形 + easeOut + 不透明度ベジェ区間 |
| 分割点 | **5 秒** → 左 4 / 右 4 KF |
| 投入 | `seedTransformKeyframeStress()` / `loadTransformKeyframeStress` |

E2E プレビューは `vite build --mode e2e`（`.env.e2e`）で `window.__FABLE_E2E__` を有効化。

## 自動検証

| テスト | 内容 |
|--------|------|
| `transformKeyframes.test.ts` | 補間・イージング・ベジェ・不透明度 |
| `transformKeyframesTimeline.test.ts` | レーン・カーブ・分割・upsert |
| `transformKeyframeBezier.test.ts` | ベジェサンプル |
| `keyframeEditRegression.test.ts` | 分割/リップル/スリップ/スライド |
| `transformKeyframeStressSetup.test.ts` | 8KF seed・4+4 分割・補間・splitClipAt |
| E2E | ストレスロード・分割・中間補間（既存: インスペクター/タイムライン/ベジェ/全属性/MG） |

## 関連ファイル

- `src/utils/transformKeyframes.ts`
- `src/utils/transformKeyframesTimeline.ts`
- `src/utils/transformKeyframeBezier.ts`
- `src/utils/transformKeyframeStressSetup.ts`
- `src/components/TransformKeyframesSection.tsx`
- `src/components/TransformKeyframesTimeline.tsx`
- `src/components/TransformKeyframeGraphEditor.tsx`
- `src/components/PreviewOverlay.tsx`
- `src/engine/compositor.ts`
- `src/store/projectStore.ts`
- `src/e2eBridge.ts`

## 既知の許容差分

| 項目 | 内容 |
|------|------|
| 調整レイヤー | transform KF 非対応（色調のみ） |
| テキスト MG 未変換 | 手続き型アニメは別経路。変換後に KF 経路へ合流 |
| 長尺ストレス | 100 クリップ計測は PERFORMANCE_AUDIT。本監査は 8KF 代表 |
