# 本番スモーク E2E 監査（v2.4.2）

最終更新: 2026-07-12（v2.4.2 / 本番スモーク 365→368）

## v2.4.2 追加（3件）

| # | シナリオ | 根拠 |
|---|---------|------|
| 366 | ユーザールック+LUT「なし」選択 undo→LUT復元 | 色調補正統合 |
| 367 | ユーザールック+LUT切替 undo→元LUT復元 | 色調補正統合 |
| 368 | LUT付きユーザールック+LUT「なし」選択 undo→LUT/ルック復元 | 色調補正統合 |

## 自動検証

- `e2e/basic.spec.ts` — 368 `test(`
- `src/utils/prodSmokeAudit.ts` — `PROD_SMOKE_SCENARIO_COUNT = 368`
