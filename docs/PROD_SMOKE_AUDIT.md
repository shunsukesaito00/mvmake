# 本番スモーク E2E 監査（v2.5.41）

最終更新: 2026-07-12（v2.5.41 / 本番スモーク 507 シナリオ・構成整理）

## v2.5.41 追加（3件）

| # | シナリオ | 根拠 |
|---|---------|------|
| 505 | ユーザールック→組み込みルック後組み込みルック2回再クリック挟みLUT付き再適用+強度+切替 undo→LUT/ルック復元 | 色調補正統合 |
| 506 | ユーザールック→組み込みルック後組み込みルック2回再クリック挟みLUT付き再適用+強度+なし undo→LUT/ルック復元 | 色調補正統合 |
| 507 | ユーザールック→組み込みルック後組み込みルック2回再クリック挟みLUT付き再適用+強度+切替+なし undo→LUT/ルック復元 | 色調補正統合 |

※ 既存 builtin-double-named-reclick 3件（user→builtin 経路）のタイトルに `・builtin-double-named-reclick` 接尾辞を付与して重複解消。重複していた旧 suffix 3件を削除し、user→builtin 組み込みルック2回再クリック named-reclick 経路を接尾辞なしタイトル3件で末尾に再配置。

## 自動検証

- `e2e/basic.spec.ts` — 507 `test(`
- `src/utils/prodSmokeAudit.ts` — `PROD_SMOKE_SCENARIO_COUNT = 507`
