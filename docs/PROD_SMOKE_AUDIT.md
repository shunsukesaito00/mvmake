# 本番スモーク E2E 監査（v2.5.70）

最終更新: 2026-07-12（v2.5.70 / 本番スモーク 507 シナリオ・構成整理）

## v2.5.70 追加（3件）

| # | シナリオ | 根拠 |
|---|---------|------|
| 505 | ユーザールック→組み込みルック後フィルム風2回再クリック挟みLUT付き再適用+強度+切替 undo→LUT/ルック復元 | 色調補正統合 |
| 506 | ユーザールック→組み込みルック後フィルム風2回再クリック挟みLUT付き再適用+強度+なし undo→LUT/ルック復元 | 色調補正統合 |
| 507 | ユーザールック→組み込みルック後フィルム風2回再クリック挟みLUT付き再適用+強度+切替+なし undo→LUT/ルック復元 | 色調補正統合 |

※ v2.5.46 で user→builtin フィルム風2回再クリック挟みは plain→suffix リネーム＋末尾 plain 3件追加済み（named-reclick 層）。v2.5.59 で short-reclick 層整理済み。v2.5.70（suffix 整理フェーズ4）では double-reclick named 層の user→builtin フィルム風2回経路を整理：既存 plain 3件（行13627付近）を `・film-double-named-reclick` 接尾辞付き named-reclick ボディに差し替え、重複していた旧 suffix 3件（行9814付近）を削除、接尾辞なし plain 3件（`film-double-named-reclick` ファイル名）を末尾に再配置。件数は 507 維持。

## フェーズ4 監査メモ（v2.5.70）

v2.5.69 で user→builtin ウエディング暖色2回・`wedding-double-named-reclick` を整理済み。次の候補は builtin→user 組み込みルック2回・`builtin-double-named-reclick`。

## 自動検証

- `e2e/basic.spec.ts` — 507 `test(`
- `src/utils/prodSmokeAudit.ts` — `PROD_SMOKE_SCENARIO_COUNT = 507`
