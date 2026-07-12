# 本番スモーク E2E 監査（v2.5.56）

最終更新: 2026-07-12（v2.5.56 / 本番スモーク 507 シナリオ・構成整理）

## v2.5.56 追加（3件）

| # | シナリオ | 根拠 |
|---|---------|------|
| 505 | 組み込み→ユーザールック後組み込みルック2回再クリック挟みLUT付き再適用+強度+切替 undo→LUT/ルック復元 | 色調補正統合 |
| 506 | 組み込み→ユーザールック後組み込みルック2回再クリック挟みLUT付き再適用+強度+なし undo→LUT/ルック復元 | 色調補正統合 |
| 507 | 組み込み→ユーザールック後組み込みルック2回再クリック挟みLUT付き再適用+強度+切替+なし undo→LUT/ルック復元 | 色調補正統合 |

※ v2.5.42 で builtin→user 組み込みルック2回再クリック挟みは plain→suffix リネーム＋末尾 plain 3件追加済み（named-reclick 層）。v2.5.56（suffix 整理フェーズ2）では short `-reclick` 層の builtin→user 組み込みルック2回経路を整理：既存 plain 3件（行13060付近）を `・builtin-double-reclick` 接尾辞付き short-reclick ボディに差し替え、重複していた旧 suffix 3件（行10384付近）を削除、接尾辞なし plain 3件（`builtin-double-named-reclick` ファイル名）を末尾に再配置。件数は 507 維持。

## フェーズ2 監査メモ（v2.5.56）

user→builtin 組み込みルック・`builtin-reclick` 単層は short-reclick ファイルを持つテストが存在しない。成立した経路として builtin→user 組み込みルック2回・`builtin-double-reclick` を整理対象とした。

## 自動検証

- `e2e/basic.spec.ts` — 507 `test(`
- `src/utils/prodSmokeAudit.ts` — `PROD_SMOKE_SCENARIO_COUNT = 507`
