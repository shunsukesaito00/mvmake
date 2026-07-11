# 縦型 9:16 プロジェクトプリセット監査（v1.96.0）

最終更新: 2026-07-11（v1.96.0 / MVP 本番品質化）

## 目的

`RESOLUTION_PRESETS` の **縦型 9:16 (1080×1920)** について、プロジェクト設定からの適用・undo・再適用で解像度と書き出しラベルが破綻しないこと、ネイティブ解像度書き出しが維持されることを本番品質として回帰監視する。

初回実装は v1.2.0。書き出しラベル・解像度整合は `exportResolution.ts`、設定プリセット保存は [PROJECT_SETTINGS_PRESET_AUDIT.md](./PROJECT_SETTINGS_PRESET_AUDIT.md)（v1.92.0）を参照。

## 適用経路

```
プロジェクト設定モーダル「縦型 9:16」
  → setProjectSettings({ width: 1080, height: 1920 }, pushHistory=true)
  → 書き出しダイアログ
    → getNativeExportButtonLabel → 「9:16 で書き出し」
    → resolveExportSize(..., 'project') → 1080×1920
```

`ProjectSettingsModal` が `RESOLUTION_PRESETS` を列挙。クリップは解像度変更の影響を受けない（キャンバスサイズのみ変更）。

## 構成（v1.96.0）

| 項目 | 値 |
|------|-----|
| プリセット ID | `vertical` |
| 解像度 | **1080×1920** |
| 書き出しラベル | **9:16 で書き出し** |
| ネイティブ書き出し | `project` 解像度 = 1080×1920 |
| デフォルト解像度 | 1920×1080（undo 復元先） |

## エッジケース

| ケース | 挙動 |
|--------|------|
| **適用 undo** | 適用直前の 1920×1080 に復元、ラベルは「1080p で書き出し」 |
| **再適用** | undo 後に縦型プリセット再選択で 1080×1920 と 9:16 ラベルが復元 |
| **設定プリセット** | 縦型を名前付き保存・適用は PROJECT_SETTINGS_PRESET 監査で別途検証 |
| **720p 書き出し** | 縦型プロジェクトでも 720p 選択時は 1280×720 にダウンスケール（解像度整合監査対象） |

## ストレステスト

| 項目 | 値 |
|------|-----|
| 投入 | `seedVertical916PresetStress()` / `loadVertical916PresetStress` |
| 再適用 | `applyVertical916Preset()` / `applyVertical916Preset`（bridge） |
| 検証 | `getVertical916PresetStressStats` / `getProjectWidth` / `getProjectHeight` |

E2E プレビューは `vite build --mode e2e`（`.env.e2e`）で `window.__FABLE_E2E__` を有効化。

## 自動検証

| テスト | 内容 |
|--------|------|
| `exportResolution.test.ts` | 9:16 ラベル・ネイティブ書き出しサイズ |
| `vertical916PresetStressSetup.test.ts` | seed・undo・再適用 |
| E2E | ストレス1080×1920/9:16ラベル・適用undo・再適用（既存: UI書き出し・設定プリセット保存） |

## 関連ファイル

- `src/types/project.ts` — `RESOLUTION_PRESETS`
- `src/utils/exportResolution.ts`
- `src/utils/vertical916PresetStressSetup.ts`
- `src/components/ProjectSettingsModal.tsx`
- `src/store/projectStore.ts` — `setProjectSettings`
- `src/e2eBridge.ts`

## 既知の許容差分

| 項目 | 内容 |
|------|------|
| クリップ配置 | 解像度変更はトランスフォーム正規化座標を維持（リフレームは手動） |
| 既存 E2E | 「書き出し: 縦型9:16…」は UI 経路のスモーク。v1.96.0 で bridge ストレスを追加 |
