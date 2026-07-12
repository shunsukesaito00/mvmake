# 本番スモーク E2E 監査（v2.5.43）

最終更新: 2026-07-12（v2.5.43 / 本番スモーク 507 シナリオ・構成整理）

## v2.5.43 追加（3件）

| # | シナリオ | 根拠 |
|---|---------|------|
| 505 | 組み込み→ユーザールック後ウエディング暖色2回再クリック挟みLUT付き再適用+強度+切替 undo→LUT/ルック復元 | 色調補正統合 |
| 506 | 組み込み→ユーザールック後ウエディング暖色2回再クリック挟みLUT付き再適用+強度+なし undo→LUT/ルック復元 | 色調補正統合 |
| 507 | 組み込み→ユーザールック後ウエディング暖色2回再クリック挟みLUT付き再適用+強度+切替+なし undo→LUT/ルック復元 | 色調補正統合 |

※ v2.5.38 で builtin→user ウエディング暖色2回再クリック挟みは plain→suffix リネーム＋末尾 plain 3件追加済み（504→507）。v2.5.43 では既存 plain 3件（行14711/14777/14843付近）に `・wedding-double-named-reclick` 接尾辞を付与し、重複していた旧 suffix 3件を削除、接尾辞なしタイトル3件を末尾に再配置（`builtin-then-user-bundled-lut-intensity-*-wedding-double-named-reclick-*` ファイル名）。件数は 507 維持。

## 自動検証

- `e2e/basic.spec.ts` — 507 `test(`
- `src/utils/prodSmokeAudit.ts` — `PROD_SMOKE_SCENARIO_COUNT = 507`
