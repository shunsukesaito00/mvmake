# オンボーディング監査（Q9）

最終更新: 2026-07-11（v1.77.0 / Phase C Q9）

## 目的

初回セッションで **「サンプル → 再生 → 書き出し」** までを **15 分以内**に完走できる導線を整備する。

## 15 分ユーザージャーニー（サンプルパス）

| 段階 | 操作 | 想定時間 | UI |
|------|------|----------|-----|
| 1 | アプリ起動・オンボーディング表示 | 1 分 | `OnboardingModal` 3 ステップ |
| 2 | 「サンプルで体験する」 | 1 分 | 最終ステップの主 CTA |
| 3 | 再生ヒント → プレビュー再生 | 2 分 | `showPlayHint`（5 秒ハイライト） |
| 4 | 書き出しヒント → MP4 ダイアログ | 3 分 | `showExportHint`（8 秒ハイライト） |
| 5 | 品質選択・書き出し実行 | 5 分 | `ExportButton` / WebCodecs |
| 6 | （任意）章マーカー In/Out 確認 | 3 分 | サンプル内 3 章 |

合計 **約 15 分**（ネットワーク・マシン性能で書き出し時間は変動）。

## サンプルプロジェクト構成（v1.77.0）

| 項目 | 値 |
|------|-----|
| 生成 | `createDemoProject()` |
| 映像 | プレースホルダー画像 6 枚 × 5.5 秒 |
| テキスト | Opening / Profile / Thank you |
| BGM | 無音 WAV（全尺） |
| 章マーカー | 3 章（オープニング / 二人の歩み / エンディング） |
| **尺** | **33 秒** |

## コーチマーク連鎖

```
openDemo()
  → setCoachmarkFromSample(true)
  → setShowPlayHint(true)
再生ヒント解除（クリック or 5秒）
  → setShowExportHint(true)
書き出しボタンクリック or 8秒
  → setShowExportHint(false)
```

## 初回表示の分岐

| 条件 | 挙動 |
|------|------|
| IndexedDB にクリップありのプロジェクト復元 | オンボーディング非表示（`fable-onboarded` を自動設定） |
| 空プロジェクト + `fable-onboarded` 未設定 | オンボーディング表示 |
| localStorage 不可 | オンボーディング非表示 |

## 婚礼テンプレパス（別経路）

本番想定の長尺編集は **結婚式フル構成テンプレ**（`applyWeddingFullTemplate`）から開始。ゴールデンパス E2E（`e2e/editor.spec.ts`）で検証。オンボーディングとは未接続（Phase D 候補）。

## プレビュー / 書き出しとの関係

サンプルも本番も `compositor.renderFrame` を共有（[RENDER_PATH_AUDIT.md](./RENDER_PATH_AUDIT.md)）。サンプル書き出しは `ensureProjectFontsLoaded` 経由でフォント検証（[TEXT_SRT_AUDIT.md](./TEXT_SRT_AUDIT.md)）。

## 自動検証

| テスト | 内容 |
|--------|------|
| `demoProject.test.ts` | 6 映像・BGM・3 章・30 秒超 |
| `e2e/basic.spec.ts` | サンプル起動・再生→書き出し誘導・空書き出しガード |
| `e2e/editor.spec.ts` | 婚礼ゴールデンパス（テンプレ起点） |

## 関連ファイル

- `src/components/OnboardingModal.tsx`
- `src/engine/demoProject.ts`
- `src/store/projectStore.ts` — `showPlayHint` / `showExportHint` / `coachmarkFromSample`
- `src/panels/PreviewPanel.tsx`
- `src/components/ExportButton.tsx`
- `e2e/basic.spec.ts`
- `e2e/helpers.ts` — `applyWeddingFullTemplate`

## 既知の許容事項

| 項目 | 内容 |
|------|------|
| 婚礼テンプレ導線 | オンボーディングからは未接続。サンプル完走が主経路 |
| 15 分 | 書き出し時間は環境依存。UI 操作のみの目安 |
| 本番スモーク | サンプル書き出し MP4 バイト検証は未追加（WebCodecs 依存） |
