# 本番スモーク E2E 監査（v2.5.32）

最終更新: 2026-07-12（v2.5.32 / 本番スモーク 483 シナリオ・+3件）

## v2.5.32 追加（3件）

| # | シナリオ | 根拠 |
|---|---------|------|
| 481 | 組み込み→ユーザールック後フィルム風再クリック挟みLUT付き再適用+強度+切替 undo→LUT/ルック復元 | 色調補正統合 |
| 482 | 組み込み→ユーザールック後フィルム風再クリック挟みLUT付き再適用+強度+なし undo→LUT/ルック復元 | 色調補正統合 |
| 483 | 組み込み→ユーザールック後フィルム風再クリック挟みLUT付き再適用+強度+切替+なし undo→LUT/ルック復元 | 色調補正統合 |

※ 既存 film-named-reclick 3件（builtin→user 経路）のタイトルに `・film-named-reclick` 接尾辞を付与して重複解消。builtin→user フィルム風単一再クリック named-reclick 経路を新規追加。

## 自動検証

- `e2e/basic.spec.ts` — 483 `test(`
- `src/utils/prodSmokeAudit.ts` — `PROD_SMOKE_SCENARIO_COUNT = 483`
