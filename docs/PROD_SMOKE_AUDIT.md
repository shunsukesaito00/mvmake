# 本番スモーク E2E 監査（v2.5.67）

最終更新: 2026-07-12（v2.5.67 / 本番スモーク 507 シナリオ・構成整理）

## v2.5.67 追加（3件）

| # | シナリオ | 根拠 |
|---|---------|------|
| 505 | 組み込み→ユーザールック後フィルム風再クリック挟みLUT付き再適用+強度+切替 undo→LUT/ルック復元 | 色調補正統合 |
| 506 | 組み込み→ユーザールック後フィルム風再クリック挟みLUT付き再適用+強度+なし undo→LUT/ルック復元 | 色調補正統合 |
| 507 | 組み込み→ユーザールック後フィルム風再クリック挟みLUT付き再適用+強度+切替+なし undo→LUT/ルック復元 | 色調補正統合 |

※ v2.5.52 で builtin→user フィルム風再クリック挟みは plain→suffix リネーム＋末尾 plain 3件追加済み（named-reclick 層）。v2.5.55 で short-reclick 層整理済み。v2.5.67（suffix 整理フェーズ3）では named-reclick 層の builtin→user フィルム風経路を整理：既存 plain 3件（行13416付近）を `・film-named-reclick` 接尾辞付き named-reclick ボディに差し替え、重複していた旧 suffix 3件（行9802付近）を削除、接尾辞なし plain 3件（`film-named-reclick` ファイル名）を末尾に再配置。件数は 507 維持。

## フェーズ3 監査メモ（v2.5.67）

user→builtin / builtin→user の単層 named-reclick 経路（builtin / wedding / film）はすべて整理済み。**フェーズ3 単層は完了**。残存する named-reclick 接尾辞は double-reclick 層（36件）が中心。次はフェーズ4（double-reclick named 層）の監査と整理開始が自然。

## 自動検証

- `e2e/basic.spec.ts` — 507 `test(`
- `src/utils/prodSmokeAudit.ts` — `PROD_SMOKE_SCENARIO_COUNT = 507`
