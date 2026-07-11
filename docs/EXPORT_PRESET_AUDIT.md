# 書き出しプリセットの保存監査（v1.98.0）

最終更新: 2026-07-11（v1.98.0 / MVP 本番品質化）

## 目的

書き出しダイアログの**プリセット保存**（localStorage）と**適用**・**`.fable-export-preset.json` 共有**について、品質・解像度・In/Out の4パターンストレス・重複名回避・破損 JSON 拒否・In/Out 再適用が破綻しないことを本番品質として回帰監視する。

初回実装は v1.8.0 付近。解像度整合は [EXPORT_RESOLUTION_ALIGNMENT_AUDIT.md](./EXPORT_RESOLUTION_ALIGNMENT_AUDIT.md)（v1.97.0）を参照。

## 保存経路

```
ExportButton（書き出しダイアログ）
  → buildExportPreset（exportPresetUtils.ts）
  → saveExportPreset（exportPresets.ts / localStorage）
適用時（UI）
  → quality / resolution をダイアログ state に反映
  → useInOut 時は setInPoint / setOutPoint（pushHistory なし）
  → 全体時は clearInOut
JSON 共有
  → buildExportedExportPresetFile / parseExportPresetFileText
  → importExportPresets（重複名は (インポート) 付与）
```

`fable-export-presets` キー。プロジェクト本体は含まない。

## ファイル形式（v1.98.0）

| フィールド | 内容 |
|-----------|------|
| `schemaVersion` | `EXPORT_PRESET_FILE_SCHEMA_VERSION` = **1** |
| `presets[]` | `name` / `quality` / `resolution` / `useInOut` / `inPoint` / `outPoint` |

`id` はファイルに含めず、インポート時に `createId()` で再発行。旧 `1080p` resolution は `project` に正規化。

## ストレス構成

| プリセット | 品質 | 解像度 | In/Out |
|-----------|------|--------|--------|
| SNS軽量 | light | 720p | なし |
| 標準全体 | standard | project | なし |
| 高品質範囲 | high | project | 2–10s |
| 軽量720p範囲 | light | 720p | 1.5–8s |

## エッジケース

| ケース | 挙動 |
|--------|------|
| **空のプリセット名** | `buildExportPreset` が拒否 |
| **不正 JSON** | `JSON の読み込みに失敗しました` |
| **schemaVersion 不一致** | `対応していないバージョンです` |
| **localStorage 破損** | `loadExportPresets` は `[]` |
| **名前重複** | `(インポート)` / `(インポート 2)` … を自動付与 |
| **In/Out 再適用** | clearInOut 後に再適用で範囲復元（undo 相当） |
| **品質/解像度の undo** | Ctrl+Z 非対象。UI からプリセット再適用で復元 |

## ストレステスト

| 項目 | 値 |
|------|-----|
| 件数 | **4 件**（`EXPORT_PRESET_STRESS_COUNT`） |
| 投入 | `seedExportPresetStress()` / `loadExportPresetStress` |
| JSON | `seedExportPresetExportStress()` / `loadExportPresetExportStress` |
| 適用 | `applyExportPresetByName(name)` |
| クリア | `clearExportPresetStress()` / `clearExportPresets` |

E2E プレビューは `vite build --mode e2e`（`.env.e2e`）で `window.__FABLE_E2E__` を有効化。

## 自動検証

| テスト | 内容 |
|--------|------|
| `exportPresetUtils.test.ts` | 保存/削除・In/Out・破損 JSON |
| `exportPresetFile.test.ts` | 往復・schema/重複名 |
| `exportPresetStressSetup.test.ts` | 4件 seed・In/Out 適用・再適用 |
| `exportPresetExportStressSetup.test.ts` | ストレス JSON・再インポート件数 |
| E2E | ストレス4件/適用・In/Outクリア再適用・JSON往復（既存: UI 保存/適用・JSON 入出力） |

## 関連ファイル

- `src/persistence/exportPresets.ts`
- `src/utils/exportPresetUtils.ts`
- `src/utils/exportPresetFile.ts`
- `src/utils/exportPresetStressSetup.ts`
- `src/utils/exportPresetExportStressSetup.ts`
- `src/components/ExportButton.tsx`
- `src/e2eBridge.ts`

## 既知の許容差分

| 項目 | 内容 |
|------|------|
| 品質/解像度 state | ExportButton ローカル state。bridge 適用は In/Out のみ |
| In/Out の undo | `setInPoint` は pushHistory しない。再適用で復元 |
| 書き出し本体 | WebCodecs 対応ブラウザのみ（別 E2E スモーク） |
