# 本番スモーク E2E 監査（v2.4.6）

最終更新: 2026-07-12（v2.4.6 / 本番スモーク 377→380）

## v2.4.6 追加（3件）

| # | シナリオ | 根拠 |
|---|---------|------|
| 378 | LUTのみ+LUT切替 undo→元LUT復元 | 色調補正統合 |
| 379 | LUTのみ+LUT「なし」選択 undo→LUT復元 | 色調補正統合 |
| 380 | LUT後組み込みルック適用 undo→組み込みルック復元 | 色調補正統合 |

## 自動検証

- `e2e/basic.spec.ts` — 380 `test(`
- `src/utils/prodSmokeAudit.ts` — `PROD_SMOKE_SCENARIO_COUNT = 380`
