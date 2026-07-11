# プロジェクト解像度と書き出しの整合監査（v1.97.0）

最終更新: 2026-07-11（v1.97.0 / MVP 本番品質化）

## 目的

プロジェクト解像度（1080p / 4K / 正方形 / 縦型9:16）と書き出し解像度（`project` / `720p`）の整合について、ネイティブ書き出し・720p ダウンスケール・ラベル表示が適用・undo・再適用で破綻しないことを本番品質として回帰監視する。

初回実装は v1.1.5。縦型プリセットは [VERTICAL_916_PRESET_AUDIT.md](./VERTICAL_916_PRESET_AUDIT.md)（v1.96.0）を参照。

## 適用経路

```
プロジェクト設定モーダル（RESOLUTION_PRESETS）
  → setProjectSettings({ width, height }, pushHistory=true)
  → 書き出しダイアログ（ExportButton）
    → getNativeExportButtonLabel / getExportResolutionLabel
    → resolveExportSize(projectW, projectH, resolution)
      → project: プロジェクト解像度そのまま
      → 720p: 常に 1280×720（アスペクト非維持の固定サイズ）
  → exportProject（exporter.ts）— scaleVideoBitrate でピクセル数に応じたビットレート
```

## 整合マトリクス（v1.97.0）

| プロジェクト | ネイティブ（project） | 720p 書き出し | ボタンラベル |
|-------------|----------------------|---------------|-------------|
| 1920×1080 | 1920×1080 | 1280×720 | 1080p で書き出し |
| 3840×2160 | 3840×2160 | 1280×720 | 4K で書き出し |
| 1080×1080 | 1080×1080 | 1280×720 | 1080×1080 で書き出し |
| 1080×1920 | 1080×1920 | 1280×720 | 9:16 で書き出し |

## エッジケース

| ケース | 挙動 |
|--------|------|
| **720p 選択** | 4K/正方形/縦型いずれも 1280×720 固定（UI ラベルも 1280×720） |
| **解像度変更 undo** | 変更直前の解像度とラベルに復元 |
| **再適用** | undo 後に別プリセット適用でネイティブ/720p 両方が再整合 |
| **旧プリセット値** | `normalizeExportResolution('1080p')` → `'project'` |

## ストレステスト

| 項目 | 値 |
|------|-----|
| 検証形式 | **4**（1080p / 4K / 正方形 / 縦型） |
| 投入後状態 | **4K**（`EXPORT_RESOLUTION_ALIGNMENT_STRESS_PRESET_ID`） |
| 投入 | `seedExportResolutionAlignmentStress()` / `loadExportResolutionAlignmentStress` |
| 再適用 | `applyResolutionPresetById(presetId)` / bridge 同名 |

## 自動検証

| テスト | 内容 |
|--------|------|
| `exportResolution.test.ts` | resolveExportSize / ラベル / ビットレートスケール |
| `exportResolutionAlignmentStressSetup.test.ts` | 4形式検証・seed・undo・正方形再適用 |
| E2E | 4形式/4K/720p整合・適用undo・正方形再適用（既存: 正方形/縦型 UI スモーク） |

## 関連ファイル

- `src/utils/exportResolution.ts`
- `src/utils/exportResolutionAlignmentStressSetup.ts`
- `src/components/ExportButton.tsx`
- `src/engine/exporter.ts`
- `src/e2eBridge.ts`

## 既知の許容差分

| 項目 | 内容 |
|------|------|
| 720p ダウンスケール | アスペクト比は維持せず 16:9 固定（仕様） |
| カスタム解像度 | プリセット外は `${width}×${height} で書き出し` ラベル |
| 書き出しプリセット | 品質・In/Out 保存は別監査対象（MVP 残） |
