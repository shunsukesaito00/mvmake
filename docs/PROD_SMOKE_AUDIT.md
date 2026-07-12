# 本番スモーク E2E 監査（v2.5.64）

最終更新: 2026-07-12（v2.5.64 / 本番スモーク 507 シナリオ・構成整理）

## v2.5.64 追加（3件）

| # | シナリオ | 根拠 |
|---|---------|------|
| 505 | ユーザールック→組み込みルック後フィルム風再クリック挟みLUT付き再適用+強度+切替 undo→LUT/ルック復元 | 色調補正統合 |
| 506 | ユーザールック→組み込みルック後フィルム風再クリック挟みLUT付き再適用+強度+なし undo→LUT/ルック復元 | 色調補正統合 |
| 507 | ユーザールック→組み込みルック後フィルム風再クリック挟みLUT付き再適用+強度+切替+なし undo→LUT/ルック復元 | 色調補正統合 |

※ v2.5.51 で user→builtin フィルム風再クリック挟みは plain→suffix リネーム＋末尾 plain 3件追加済み（named-reclick 層）。v2.5.55 で short-reclick 層整理済み（builtin→user フィルム風経路）。v2.5.64（suffix 整理フェーズ3）では named-reclick 層の user→builtin フィルム風経路を整理：既存 plain 3件（行13262付近）を `・film-named-reclick` 接尾辞付き named-reclick ボディに差し替え、重複していた旧 suffix 3件（行10184付近）を削除、接尾辞なし plain 3件（`film-named-reclick` ファイル名）を末尾に再配置。件数は 507 維持。

## フェーズ3 監査メモ（v2.5.64）

user→builtin の単層 named-reclick 経路（builtin / wedding / film）はすべて整理済み。次の候補は builtin→user 組み込みルック・`builtin-named-reclick` または builtin→user ウエディング暖色・`wedding-named-reclick`。

## 自動検証

- `e2e/basic.spec.ts` — 507 `test(`
- `src/utils/prodSmokeAudit.ts` — `PROD_SMOKE_SCENARIO_COUNT = 507`
