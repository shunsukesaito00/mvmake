# 本番スモーク E2E 監査（v2.4.3）

最終更新: 2026-07-12（v2.4.3 / 本番スモーク 368→371）

## v2.4.3 追加（3件）

| # | シナリオ | 根拠 |
|---|---------|------|
| 369 | LUT切替 undo→元LUT復元 | 色調補正統合 |
| 370 | 組み込みルック+LUT「なし」選択 undo→LUT/ルック復元 | 色調補正統合 |
| 371 | LUT適用後ユーザールック適用 undo→LUT復元 | 色調補正統合 |

## 自動検証

- `e2e/basic.spec.ts` — 371 `test(`
- `src/utils/prodSmokeAudit.ts` — `PROD_SMOKE_SCENARIO_COUNT = 371`
