# テンプレートのユーザー保存監査（v1.90.0）

最終更新: 2026-07-11（v1.90.0 / MVP 本番品質化）

## 目的

テンプレタブの**ユーザーテンプレート保存**（localStorage）と**現在プロジェクトへの適用**・**新規プロジェクト作成**について、構造化ウェディング規模の構成でも保存・復元・削除・適用 undo が破綻しないことを本番品質として回帰監視する。

JSON エクスポート/インポートは [v1.10.0](../README.md) 別機能（本監査の E2E スモークは既存）。

## 保存経路

```
UserProjectTemplatesSection（テンプレタブ）
  → buildUserProjectTemplate（userProjectTemplate.ts）
  → saveUserProjectTemplate（userProjectTemplates.ts / localStorage）
適用時
  → applyUserProjectTemplate（projectStore, pushHistory=true）
新規作成時
  → createProjectFromUserTemplate（メディア破棄・履歴クリア）
```

`fable-user-project-templates` キー。メディア素材は保存せず、クリップ配置・マーカー・解像度/FPS のみ。

## 復元ルール（v1.90.0）

| 操作 | 挙動 |
|------|------|
| **保存** | トラック種別 + trackIndex でクリップを紐付け。id/trackId は再生成 |
| **適用** | 既存クリップをクリアしてから復元。width/height/fps も上書き |
| **新規作成** | 新規 Project ID・メディア空・undo 履歴クリア |
| **削除** | localStorage から ID 指定で除去（undo 不可） |
| **適用 undo** | 適用直前の空プロジェクト状態に復元 |

### エッジケース

| ケース | 挙動 |
|--------|------|
| **空のテンプレート名** | `buildUserProjectTemplate` が拒否 |
| **破損 JSON** | `loadUserProjectTemplates` は `[]` |
| **映像2トラック目** | `trackIndex: 1` のクリップを副映像トラックへ配置 |
| **メディア未同梱** | 復元後タイムラインにクリップはあるがメディアパネルは空（許容） |

## ストレステスト

| 項目 | 値 |
|------|-----|
| ベース | `structured-wedding` テンプレート適用後に保存 |
| クリップ数 | テキスト + 写真ガイド（**11 件**） |
| マーカー数 | **5 件** |
| 投入 | `seedUserProjectTemplateStress()` / `loadUserProjectTemplateStress` |
| クリア | `clearUserProjectTemplateStress()` / `clearUserProjectTemplates` |

E2E プレビューは `vite build --mode e2e`（`.env.e2e`）で `window.__FABLE_E2E__` を有効化。

## 自動検証

| テスト | 内容 |
|--------|------|
| `userProjectTemplate.test.ts` | 保存/復元・2映像トラック・破損 JSON |
| `userProjectTemplateStressSetup.test.ts` | ストレス seed/clear |
| `projectStore.test.ts` | 適用・新規作成・適用 undo・メディア破棄 |
| E2E | 適用 undo・削除・ストレス新規作成（既存: 保存/適用/新規・JSON 入出力） |

## 関連ファイル

- `src/utils/userProjectTemplate.ts`
- `src/utils/userProjectTemplateStressSetup.ts`
- `src/persistence/userProjectTemplates.ts`
- `src/components/UserProjectTemplatesSection.tsx`
- `src/components/ProjectListModal.tsx` — 新規作成
- `src/store/projectStore.ts`
- `src/e2eBridge.ts`

## 既知の許容差分

| 項目 | 内容 |
|------|------|
| 保存の undo | localStorage への保存自体は undo 不可 |
| メディア | 配置情報のみ保存。適用後はメディアの再インポートが必要 |
| 同名テンプレート | 別 ID として複数保存可（テキストスタイルプリセットの同名上書きとは異なる） |
