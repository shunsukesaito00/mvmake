# 本番スモーク E2E 監査（v2.5.65）

最終更新: 2026-07-12（v2.5.65 / 本番スモーク 507 シナリオ・構成整理）

## v2.5.65 追加（3件）

| # | シナリオ | 根拠 |
|---|---------|------|
| 505 | 組み込み→ユーザールック後組み込みルック再クリック挟みLUT付き再適用+強度+切替 undo→LUT/ルック復元 | 色調補正統合 |
| 506 | 組み込み→ユーザールック後組み込みルック再クリック挟みLUT付き再適用+強度+なし undo→LUT/ルック復元 | 色調補正統合 |
| 507 | 組み込み→ユーザールック後組み込みルック再クリック挟みLUT付き再適用+強度+切替+なし undo→LUT/ルック復元 | 色調補正統合 |

※ v2.5.48 で builtin→user 組み込みルック再クリック挟みは plain→suffix リネーム＋末尾 plain 3件追加済み（named-reclick 層）。v2.5.65（suffix 整理フェーズ3）では named-reclick 層の builtin→user 組み込みルック経路を整理：既存 plain 3件（行12512付近）を `・builtin-named-reclick` 接尾辞付き named-reclick ボディに差し替え、重複していた旧 suffix 3件（行9993付近）を削除、接尾辞なし plain 3件（`builtin-named-reclick` ファイル名）を末尾に再配置。件数は 507 維持。

## フェーズ3 監査メモ（v2.5.65）

user→builtin 単層 named-reclick は v2.5.64 で完了。次の候補は builtin→user ウエディング暖色・`wedding-named-reclick` または builtin→user フィルム風・`film-named-reclick`。

## 自動検証

- `e2e/basic.spec.ts` — 507 `test(`
- `src/utils/prodSmokeAudit.ts` — `PROD_SMOKE_SCENARIO_COUNT = 507`
