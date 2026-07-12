# 本番スモーク E2E 監査（v2.5.47）

最終更新: 2026-07-12（v2.5.47 / 本番スモーク 507 シナリオ・構成整理）

## v2.5.47 追加（3件）

| # | シナリオ | 根拠 |
|---|---------|------|
| 505 | ユーザールック→組み込みルック後組み込みルック再クリック挟みLUT付き再適用+強度+切替 undo→LUT/ルック復元 | 色調補正統合 |
| 506 | ユーザールック→組み込みルック後組み込みルック再クリック挟みLUT付き再適用+強度+なし undo→LUT/ルック復元 | 色調補正統合 |
| 507 | ユーザールック→組み込みルック後組み込みルック再クリック挟みLUT付き再適用+強度+切替+なし undo→LUT/ルック復元 | 色調補正統合 |

※ v2.5.33 で user→builtin 組み込みルック再クリック挟みは plain→suffix リネーム＋末尾 plain 3件追加済み（486→489）。v2.5.47 では既存 plain 3件（行12824/12882/12940付近）に `・builtin-named-reclick` 接尾辞を付与し、重複していた旧 suffix 3件を削除、接尾辞なしタイトル3件を末尾に再配置（`user-then-builtin-bundled-lut-intensity-*-builtin-named-reclick-*` ファイル名）。件数は 507 維持。

## 自動検証

- `e2e/basic.spec.ts` — 507 `test(`
- `src/utils/prodSmokeAudit.ts` — `PROD_SMOKE_SCENARIO_COUNT = 507`
