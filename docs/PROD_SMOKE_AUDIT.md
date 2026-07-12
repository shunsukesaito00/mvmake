# 本番スモーク E2E 監査（v2.5.73）

最終更新: 2026-07-12（v2.5.73 / 本番スモーク 507 シナリオ・構成整理）

## v2.5.73 追加（3件）

| # | シナリオ | 根拠 |
|---|---------|------|
| 505 | 組み込み→ユーザールック後フィルム風2回再クリック挟みLUT付き再適用+強度+切替 undo→LUT/ルック復元 | 色調補正統合 |
| 506 | 組み込み→ユーザールック後フィルム風2回再クリック挟みLUT付き再適用+強度+なし undo→LUT/ルック復元 | 色調補正統合 |
| 507 | 組み込み→ユーザールック後フィルム風2回再クリック挟みLUT付き再適用+強度+切替+なし undo→LUT/ルック復元 | 色調補正統合 |

※ v2.5.45 で builtin→user フィルム風2回再クリック挟みは plain→suffix リネーム＋末尾 plain 3件追加済み（named-reclick 層）。v2.5.61 で short-reclick 層整理済み。v2.5.73（suffix 整理フェーズ4 完了）では double-reclick named 層の builtin→user フィルム風2回経路を整理：既存 plain 3件（行13444付近）を `・film-double-named-reclick` 接尾辞付き named-reclick ボディに差し替え、重複していた旧 suffix 3件（行9410付近）を削除、接尾辞なし plain 3件（`film-double-named-reclick` ファイル名）を末尾に再配置。件数は 507 維持。

## フェーズ4 監査メモ（v2.5.73）

v2.5.68〜v2.5.73 で double-reclick named 層の suffix 整理フェーズ4を完了。user→builtin（組み込みルック/ウエディング暖色/フィルム風）および builtin→user（組み込みルック/ウエディング暖色/フィルム風）の全6経路を整理済み。

## 自動検証

- `e2e/basic.spec.ts` — 507 `test(`
- `src/utils/prodSmokeAudit.ts` — `PROD_SMOKE_SCENARIO_COUNT = 507`
