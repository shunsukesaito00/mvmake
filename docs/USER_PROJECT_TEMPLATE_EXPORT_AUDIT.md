# ユーザーテンプレートのエクスポート/インポート監査（v1.91.0）

最終更新: 2026-07-11（v1.91.0 / MVP 本番品質化）

## 目的

テンプレタブの **`.fable-template.json` エクスポート/インポート**について、JSON 往復・重複ラベル回避・破損ファイル拒否・構造化ウェディング規模のストレス往復が破綻しないことを本番品質として回帰監視する。

localStorage への保存・適用は [USER_PROJECT_TEMPLATE_AUDIT.md](./USER_PROJECT_TEMPLATE_AUDIT.md)（v1.90.0）を参照。

## 入出力経路

```
エクスポート
  UserProjectTemplatesSection → exportUserProjectTemplateFile
    → buildExportedUserProjectTemplate（schemaVersion 付き）
    → downloadBlob（.fable-template.json）

インポート
  ファイル選択 → importUserProjectTemplateFromFile
    → parseExportedUserProjectTemplate
    → userProjectTemplateFromExport（ラベル重複回避・新 ID 発行）
    → saveUserProjectTemplate
```

## ファイル形式（v1.91.0）

| フィールド | 内容 |
|-----------|------|
| `schemaVersion` | `USER_PROJECT_TEMPLATE_SCHEMA_VERSION` = **1** |
| `label` / `description` | 表示名・説明 |
| `width` / `height` / `fps` | プロジェクト設定 |
| `markers` / `clipEntries` | id/trackId を除いた構成 |

`id` / `createdAt` はファイルに含めず、インポート時に再発行。

## エッジケース

| ケース | 挙動 |
|--------|------|
| **不正 JSON** | `テンプレートファイルの JSON が読み取れません` |
| **schemaVersion 不一致** | `対応していないバージョンです` |
| **空白ラベル** | `テンプレート名がありません` |
| **label 重複** | `(インポート)` / `(インポート 2)` … を自動付与 |
| **メディア未同梱** | 配置情報のみ復元（許容） |

## ストレステスト

| 項目 | 値 |
|------|-----|
| ベース | `userProjectTemplateStressSetup`（構造化ウェディング・11 クリップ・5 マーカー） |
| 投入 | `seedUserProjectTemplateExportStress()` / `loadUserProjectTemplateExportStress` |
| 往復 | `importUserProjectTemplateJson`（E2E bridge） |

E2E プレビューは `vite build --mode e2e`（`.env.e2e`）で `window.__FABLE_E2E__` を有効化。

## 自動検証

| テスト | 内容 |
|--------|------|
| `userProjectTemplateExport.test.ts` | ペイロード・パース拒否・ラベル重複・JSON 往復 |
| `userProjectTemplateExportStressSetup.test.ts` | ストレス JSON・再インポート件数 |
| E2E | 破損 JSON・重複ラベル2回・ストレス往復新規作成（既存: UI エクスポート/インポート） |

## 関連ファイル

- `src/utils/userProjectTemplateExport.ts`
- `src/utils/userProjectTemplateExportStressSetup.ts`
- `src/persistence/userProjectTemplates.ts`
- `src/components/UserProjectTemplatesSection.tsx`
- `src/e2eBridge.ts`

## 既知の許容差分

| 項目 | 内容 |
|------|------|
| インポート undo | localStorage 追加は undo 不可 |
| 同名上書き | 別 ID として追加（ユーザー保存の同名上書きとは異なる） |
| メディア | JSON に素材 Blob は含まれない |
