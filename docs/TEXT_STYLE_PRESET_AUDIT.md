# テキストスタイルのユーザー保存監査（v1.84.0）

最終更新: 2026-07-11（v1.84.0 / MVP 本番品質化）

## 目的

インスペクターの**スタイルプリセット**でテキスト書式を localStorage に保存し、他クリップへ適用するワークフローについて、**永続化・同名上書き・削除・適用 undo** が破綻しないことを本番品質として回帰監視する。

## 保存経路

```
TextStylePresetsSection（インスペクター）
  → buildSavedTextStylePreset（textStylePresetUtils）
  → saveTextStylePreset（textStylePresets.ts / localStorage）
適用時
  → applyTextStylePreset（content 保持）
  → updateClip({ text }, recordHistory=true) — undo 対象
```

`TEXT_PRESETS`（組み込みテロップ）とは別経路。ユーザー保存は `fable-text-style-presets` キー。

## 同名上書き（v1.84.0）

| 条件 | 挙動 |
|------|------|
| 新規名 | 配列末尾に追加 |
| **trim 一致の既存名** | 既存 ID を維持して style のみ上書き、件数不変 |
| 空名 | `buildSavedTextStylePreset` が拒否 |

## 永続化エッジケース

| ケース | 挙動 |
|--------|------|
| 破損 JSON | `loadTextStylePresets` は `[]` |
| 欠損フィールド | `normalizeStyle` でデフォルト補完 |
| 削除 | `deleteTextStylePreset` で ID 指定削除 |

## ストレステスト

| 項目 | 値 |
|------|-----|
| 保存件数 | `TEXT_STYLE_PRESET_STRESS_COUNT` = **8** |
| 投入 | `seedTextStylePresetStress()` / `window.__FABLE_E2E__.loadTextStylePresetStress` |
| クリア | `clearTextStylePresetStress()` / `clearTextStylePresets` |

## 自動検証

| テスト | 内容 |
|--------|------|
| `textStylePresetUtils.test.ts` | 保存/削除・同名上書き・破損 JSON |
| `textStylePresetStressSetup.test.ts` | ストレス seed/clear |
| `projectStore.test.ts` | スタイル適用 undo |
| E2E | 同名上書き・削除・適用 undo |

## 関連ファイル

- `src/persistence/textStylePresets.ts`
- `src/utils/textStylePresetUtils.ts`
- `src/utils/textStylePresetStressSetup.ts`
- `src/components/TextStylePresetsSection.tsx`
- `src/panels/InspectorPanel.tsx`
- `src/e2eBridge.ts`

## 既知の許容差分

| 項目 | 内容 |
|------|------|
| 保存の undo | クリップ書式の**適用**のみ undo 対象。localStorage への保存自体は undo 不可 |
| 端末間共有 | JSON エクスポート未実装（プロジェクト設定プリセットと別機能） |
