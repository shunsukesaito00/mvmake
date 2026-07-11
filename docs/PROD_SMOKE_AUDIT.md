# 本番スモーク E2E 監査（v2.5.29）

最終更新: 2026-07-12（v2.5.29 / 本番スモーク 474 シナリオ・+3件）

## v2.5.29 追加（3件）

| # | シナリオ | 根拠 |
|---|---------|------|
| 472 | ユーザールック→組み込みルック後組み込みルック2回再クリック挟みLUT付き再適用+強度+切替 undo→LUT/ルック復元 | 色調補正統合 |
| 473 | ユーザールック→組み込みルック後組み込みルック2回再クリック挟みLUT付き再適用+強度+なし undo→LUT/ルック復元 | 色調補正統合 |
| 474 | ユーザールック→組み込みルック後組み込みルック2回再クリック挟みLUT付き再適用+強度+切替+なし undo→LUT/ルック復元 | 色調補正統合 |

※ 既存 builtin-double-named-reclick 3件のタイトルに `・builtin-double-named-reclick` 接尾辞を付与して重複解消（`・builtin-double-reclick` は v2.5.23 経路で使用中）。user→builtin 組み込みルック2回 named-reclick 経路を新規追加。

## 自動検証

- `e2e/basic.spec.ts` — 474 `test(`
- `src/utils/prodSmokeAudit.ts` — `PROD_SMOKE_SCENARIO_COUNT = 474`
