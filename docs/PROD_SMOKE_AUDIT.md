# 本番スモーク E2E 監査（v2.5.61）

最終更新: 2026-07-12（v2.5.61 / 本番スモーク 507 シナリオ・構成整理）

## v2.5.61 追加（3件）

| # | シナリオ | 根拠 |
|---|---------|------|
| 505 | 組み込み→ユーザールック後フィルム風2回再クリック挟みLUT付き再適用+強度+切替 undo→LUT/ルック復元 | 色調補正統合 |
| 506 | 組み込み→ユーザールック後フィルム風2回再クリック挟みLUT付き再適用+強度+なし undo→LUT/ルック復元 | 色調補正統合 |
| 507 | 組み込み→ユーザールック後フィルム風2回再クリック挟みLUT付き再適用+強度+切替+なし undo→LUT/ルック復元 | 色調補正統合 |

※ v2.5.45 で builtin→user フィルム風2回再クリック挟みは plain→suffix リネーム＋末尾 plain 3件追加済み（named-reclick 層）。v2.5.61（suffix 整理フェーズ2）では short `-reclick` 層の builtin→user フィルム風2回経路を整理：既存 plain 3件（行12680付近）を `・film-double-reclick` 接尾辞付き short-reclick ボディに差し替え、重複していた旧 suffix 3件（行9410付近）を削除、接尾辞なし plain 3件（`film-double-named-reclick` ファイル名）を末尾に再配置。件数は 507 維持。

## フェーズ2 監査メモ（v2.5.61）

user→builtin / builtin→user の double-reclick 経路（builtin-double / wedding-double / film-double）はすべて整理済み。フェーズ2 の short `-reclick` 層は完了。

## 自動検証

- `e2e/basic.spec.ts` — 507 `test(`
- `src/utils/prodSmokeAudit.ts` — `PROD_SMOKE_SCENARIO_COUNT = 507`
