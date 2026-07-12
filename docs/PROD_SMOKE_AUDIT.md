# 本番スモーク E2E 監査（v2.5.53）

最終更新: 2026-07-12（v2.5.53 / 本番スモーク 507 シナリオ・構成整理）

## v2.5.53 追加（3件）

| # | シナリオ | 根拠 |
|---|---------|------|
| 505 | ユーザールック→組み込みルック後組み込みルック再クリック挟みLUT付き再適用+強度+切替 undo→LUT/ルック復元 | 色調補正統合 |
| 506 | ユーザールック→組み込みルック後組み込みルック再クリック挟みLUT付き再適用+強度+なし undo→LUT/ルック復元 | 色調補正統合 |
| 507 | ユーザールック→組み込みルック後組み込みルック再クリック挟みLUT付き再適用+強度+切替+なし undo→LUT/ルック復元 | 色調補正統合 |

※ v2.5.47 で user→builtin 組み込みルック再クリック挟みは plain→suffix リネーム＋末尾 plain 3件追加済み（named-reclick 層）。v2.5.53（suffix 整理フェーズ2）では short `-reclick` 層の user→builtin 組み込みルック経路を整理：既存 plain 3件（行14593付近）を `・builtin-reclick` 接尾辞付き short-reclick ボディに差し替え、重複していた旧 suffix 3件（行9410付近）を削除、接尾辞なし plain 3件（`builtin-named-reclick` ファイル名）を末尾に再配置。件数は 507 維持。

## フェーズ2 監査メモ

short 接尾辞（`builtin-reclick` / `wedding-reclick` / `film-reclick` / `*-double-reclick`）は named-reclick 層とファイル名が異なるため、同一ファイルの plain+suffix ペアは成立しない。v2.5.53 は user→builtin 組み込みルック・`builtin-reclick` を優先経路として、plain 待ち行列の short-reclick ボディ差し替え＋旧 suffix 削除＋末尾 plain 再配置で対応。

## 自動検証

- `e2e/basic.spec.ts` — 507 `test(`
- `src/utils/prodSmokeAudit.ts` — `PROD_SMOKE_SCENARIO_COUNT = 507`
