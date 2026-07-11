# 本番スモーク E2E 監査（v2.5.33）

最終更新: 2026-07-12（v2.5.33 / 本番スモーク 486 シナリオ・+3件）

## v2.5.33 追加（3件）

| # | シナリオ | 根拠 |
|---|---------|------|
| 484 | ユーザールック→組み込みルック後組み込みルック再クリック挟みLUT付き再適用+強度+切替 undo→LUT/ルック復元 | 色調補正統合 |
| 485 | ユーザールック→組み込みルック後組み込みルック再クリック挟みLUT付き再適用+強度+なし undo→LUT/ルック復元 | 色調補正統合 |
| 486 | ユーザールック→組み込みルック後組み込みルック再クリック挟みLUT付き再適用+強度+切替+なし undo→LUT/ルック復元 | 色調補正統合 |

※ 既存 builtin-named-reclick 3件（user→builtin 経路）のタイトルに `・builtin-named-reclick` 接尾辞を付与して重複解消（`・builtin-reclick` は v2.5.20 経路で使用中）。user→builtin 組み込みルック単一再クリック named-reclick 経路を新規追加。

## 自動検証

- `e2e/basic.spec.ts` — 486 `test(`
- `src/utils/prodSmokeAudit.ts` — `PROD_SMOKE_SCENARIO_COUNT = 486`
