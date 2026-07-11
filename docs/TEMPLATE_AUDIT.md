# テンプレート監査（v2.1.0）

最終更新: 2026-07-11（v2.1.0 / MVP 本番品質化・最終卒業）

## 目的

**結婚式ムービー組み込み4種**（オープニング / プロフィール / エンディング / 結婚式フル構成）と **ユーザーテンプレート保存・JSON 入出力**の統合経路が破綻しないことを本番品質として回帰監視する。

分割監査: [STRUCTURED_WEDDING_TEMPLATE_AUDIT.md](./STRUCTURED_WEDDING_TEMPLATE_AUDIT.md)（v1.95.0）、[USER_PROJECT_TEMPLATE_AUDIT.md](./USER_PROJECT_TEMPLATE_AUDIT.md)（v1.90.0）、[USER_PROJECT_TEMPLATE_EXPORT_AUDIT.md](./USER_PROJECT_TEMPLATE_EXPORT_AUDIT.md)（v1.91.0）。今回は **テンプレート行全体**の統合卒業。

## 処理経路

```
MediaPanel テンプレートタブ
  → applyTemplate（組み込み4種）
    → buildTemplateTextClips / buildPhotoGuideClips / buildTemplateMarkers

UserProjectTemplatesSection
  → buildUserProjectTemplate → localStorage
  → applyUserProjectTemplate / createProjectFromUserTemplate
  → export/import .fable-template.json（schemaVersion）
```

## ストレス構成（v2.1.0）

| 組み込みテンプレ | ID | クリップ数 |
|-----------------|-----|-----------|
| オープニング | `opening-movie` | **1** |
| プロフィール | `profile-movie` | **1** |
| エンディング | `ending-movie` | **2** |
| 結婚式フル構成 | `structured-wedding` | **11**（テキスト3 + 写真ガイド8） |

| ユーザー保存 | 内容 |
|-------------|------|
| ラベル | `ストレステンプレ統合検証` |
| ベース | 構造化ウェディング適用後の構成 |
| JSON | `schemaVersion` 付き `.fable-template.json` 往復 |

## エッジケース

| ケース | 挙動 |
|--------|------|
| **空テンプレ名** | `buildUserProjectTemplate` が拒否 |
| **破損 JSON** | `JSON が読み取れません` |
| **schemaVersion 不一致** | バージョンエラー |
| **適用 undo** | `applyUserProjectTemplate` の `pushHistory` |
| **重複ラベル import** | `(インポート)` サフィックス（v1.91.0） |

## ストレステスト

| 項目 | 値 |
|------|-----|
| 組み込み | **4** 種 |
| 投入 | `seedTemplateStress()` / `loadTemplateStress` |
| 操作 | `applyBuiltinTemplateById` / `applyUserTemplateById` / `importTemplateStressJson` |

E2E プレビューは `vite build --mode e2e`（`.env.e2e`）で `window.__FABLE_E2E__` を有効化。

## 自動検証

| テスト | 内容 |
|--------|------|
| `weddingTemplate.test.ts` | テキスト/ガイド/マーカー生成 |
| `userProjectTemplate.test.ts` | 保存・復元・適用 |
| `userProjectTemplateExport.test.ts` | JSON 往復・破損拒否 |
| `templateStressSetup.test.ts` | 4種・seed・JSON・undo・破損JSON |
| E2E | 統合ストレス・ユーザーundo・破損JSON（既存: UI スモーク多数） |

## 関連ファイル

- `src/types/project.ts` — `PROJECT_TEMPLATES`
- `src/utils/weddingTemplate.ts`
- `src/utils/userProjectTemplate.ts`
- `src/utils/templateStressSetup.ts`
- `src/store/projectStore.ts` — `applyTemplate` / `applyUserProjectTemplate`
- `src/persistence/userProjectTemplates.ts`
- `src/e2eBridge.ts`

## 既知の許容差分

| 項目 | 内容 |
|------|------|
| メディア | テンプレ適用はテキスト/マーカーのみ（素材は別途投入） |
| 累積適用 | `applyTemplate` は既存クリップに追加（ストレスは reset 後に適用） |
| ストレージ | ユーザーテンプレは localStorage（サーバー同期なし） |
