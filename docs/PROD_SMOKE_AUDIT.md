# 本番スモーク E2E 監査（v2.5.40）

最終更新: 2026-07-12（v2.5.40 / 本番スモーク 507 シナリオ・+3件）

## v2.5.40 追加（3件）

| # | シナリオ | 根拠 |
|---|---------|------|
| 505 | 組み込み→ユーザールック後フィルム風2回再クリック挟みLUT付き再適用+強度+切替 undo→LUT/ルック復元 | 色調補正統合 |
| 506 | 組み込み→ユーザールック後フィルム風2回再クリック挟みLUT付き再適用+強度+なし undo→LUT/ルック復元 | 色調補正統合 |
| 507 | 組み込み→ユーザールック後フィルム風2回再クリック挟みLUT付き再適用+強度+切替+なし undo→LUT/ルック復元 | 色調補正統合 |

※ 既存 film-double-named-reclick 3件（builtin→user 経路）のタイトルに `・film-double-named-reclick` 接尾辞を付与して重複解消。builtin→user フィルム風2回再クリック named-reclick 経路を新規追加。

## 自動検証

- `e2e/basic.spec.ts` — 507 `test(`
- `src/utils/prodSmokeAudit.ts` — `PROD_SMOKE_SCENARIO_COUNT = 507`
