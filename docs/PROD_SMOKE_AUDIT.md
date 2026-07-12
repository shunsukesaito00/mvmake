# 本番スモーク E2E 監査（v2.5.55）

最終更新: 2026-07-12（v2.5.55 / 本番スモーク 507 シナリオ・構成整理）

## v2.5.55 追加（3件）

| # | シナリオ | 根拠 |
|---|---------|------|
| 505 | 組み込み→ユーザールック後フィルム風再クリック挟みLUT付き再適用+強度+切替 undo→LUT/ルック復元 | 色調補正統合 |
| 506 | 組み込み→ユーザールック後フィルム風再クリック挟みLUT付き再適用+強度+なし undo→LUT/ルック復元 | 色調補正統合 |
| 507 | 組み込み→ユーザールック後フィルム風再クリック挟みLUT付き再適用+強度+切替+なし undo→LUT/ルック復元 | 色調補正統合 |

※ v2.5.52 で builtin→user フィルム風再クリック挟みは plain→suffix リネーム＋末尾 plain 3件追加済み（named-reclick 層）。v2.5.55（suffix 整理フェーズ2）では short `-reclick` 層の builtin→user フィルム風経路を整理：既存 plain 3件（行15171付近）を `・film-reclick` 接尾辞付き short-reclick ボディに差し替え（旧 suffix は `・builtin-reclick` 誤ラベル）、重複していた旧 suffix 3件（行10454付近）を削除、接尾辞なし plain 3件（`film-named-reclick` ファイル名）を末尾に再配置。件数は 507 維持。

## フェーズ2 監査メモ（v2.5.55）

user→builtin フィルム風・`film-reclick` 単層は short-reclick ファイルを持つテストが存在しない（named-reclick 層のみ）。成立した経路として builtin→user フィルム風・`film-reclick`（旧 `・builtin-reclick` 誤ラベル付き short suffix）を整理対象とした。

## 自動検証

- `e2e/basic.spec.ts` — 507 `test(`
- `src/utils/prodSmokeAudit.ts` — `PROD_SMOKE_SCENARIO_COUNT = 507`
