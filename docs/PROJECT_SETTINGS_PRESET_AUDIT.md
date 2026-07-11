# プロジェクト設定プリセットのユーザー保存監査（v1.92.0）

最終更新: 2026-07-11（v1.92.0 / MVP 本番品質化）

## 目的

プロジェクト設定モーダルの**設定プリセット保存**（localStorage）と**適用**・**`.fable-project-preset.json` 共有**について、婚礼向け6形式（横型/縦型/正方形/4K/720p/シネマ）のストレス往復・重複名回避・破損 JSON 拒否・適用 undo が破綻しないことを本番品質として回帰監視する。

JSON 共有の初回実装は v1.40.0。本監査は保存〜適用〜往復の一連を MVP 表記から卒業する。

## 保存経路

```
ProjectSettingsPresetsSection（プロジェクト設定モーダル）
  → buildProjectSettingsPreset（projectSettingsPresetUtils.ts）
  → saveProjectSettingsPreset（projectSettingsPresets.ts / localStorage）
適用時
  → applyProjectSettingsPreset（projectStore, pushHistory=true）
    → width/height/fps + rippleDelete + loopPlayback を一括更新
```

`fable-project-settings-presets` キー。クリップやメディアは含まない。

## ファイル形式（v1.92.0）

| フィールド | 内容 |
|-----------|------|
| `schemaVersion` | `PROJECT_SETTINGS_PRESET_FILE_SCHEMA_VERSION` = **1** |
| `presets[]` | `name` / `width` / `height` / `fps` / `rippleDelete` / `loopPlayback` |

`id` はファイルに含めず、インポート時に `createId()` で再発行。

## エッジケース

| ケース | 挙動 |
|--------|------|
| **空のプリセット名** | `buildProjectSettingsPreset` が拒否 |
| **不正 JSON** | `JSON の読み込みに失敗しました` |
| **schemaVersion 不一致** | `対応していないバージョンです` |
| **解像度/FPS 範囲外** | `解像度の値が不正です` / `FPS の値が不正です` |
| **localStorage 破損** | `loadProjectSettingsPresets` は `[]` |
| **名前重複** | `(インポート)` / `(インポート 2)` … を自動付与 |
| **適用 undo** | 適用直前の解像度・FPS・リップル・ループに復元 |

## ストレステスト

| 項目 | 値 |
|------|-----|
| ベース | 婚礼6形式（1080p横/9:16縦/正方形/4K/720p/シネマ2.39） |
| 件数 | **6 件**（`PROJECT_SETTINGS_PRESET_STRESS_COUNT`） |
| 投入 | `seedProjectSettingsPresetStress()` / `loadProjectSettingsPresetStress` |
| JSON | `seedProjectSettingsPresetExportStress()` / `loadProjectSettingsPresetExportStress` |
| クリア | `clearProjectSettingsPresetStress()` / `clearProjectSettingsPresets` |

E2E プレビューは `vite build --mode e2e`（`.env.e2e`）で `window.__FABLE_E2E__` を有効化。

## 自動検証

| テスト | 内容 |
|--------|------|
| `projectSettingsPresetUtils.test.ts` | 保存/適用/undo・破損 localStorage・重複名インポート |
| `projectSettingsPresetFile.test.ts` | 往復・schema/解像度/JSON 拒否 |
| `projectSettingsPresetStressSetup.test.ts` | 6形式 seed/clear |
| `projectSettingsPresetExportStressSetup.test.ts` | ストレス JSON・再インポート件数 |
| E2E | 破損 JSON・重複名2回・ストレス6形式往復適用（既存: UI 保存/適用・JSON 入出力） |

## 関連ファイル

- `src/utils/projectSettingsPresetUtils.ts`
- `src/utils/projectSettingsPresetFile.ts`
- `src/utils/projectSettingsPresetStressSetup.ts`
- `src/utils/projectSettingsPresetExportStressSetup.ts`
- `src/persistence/projectSettingsPresets.ts`
- `src/components/ProjectSettingsPresetsSection.tsx`
- `src/components/ProjectSettingsModal.tsx`
- `src/store/projectStore.ts`
- `src/e2eBridge.ts`

## 既知の許容差分

| 項目 | 内容 |
|------|------|
| 保存の undo | localStorage への保存自体は undo 不可 |
| 削除の undo | 削除は undo 不可 |
| 複数件インポート toast | 2件以上は「N 件設定プリセットをインポート」表示。単件はファイル上の元名（解決後名ではない） |
| 適用とモーダル | 適用後もモーダル内 FPS スライダーは手動で「適用」するまでプロジェクトに未反映の場合あり |
