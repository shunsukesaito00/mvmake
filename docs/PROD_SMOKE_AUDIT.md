# 本番スモーク E2E 監査（v2.5.0）

最終更新: 2026-07-12（v2.5.0 / 本番スモーク 389→392）

## v2.5.0 追加（3件）

| # | シナリオ | 根拠 |
|---|---------|------|
| 390 | 組み込みルック+LUT強度+切替+なし undo→LUT/ルック復元 | 色調補正統合 |
| 391 | LUTのみ+LUT強度+切替+なし undo→LUT復元 | 色調補正統合 |
| 392 | LUT付きユーザールック+LUT強度+なし undo→LUT/ルック復元 | 色調補正統合 |

## 自動検証

- `e2e/basic.spec.ts` — 392 `test(`
- `src/utils/prodSmokeAudit.ts` — `PROD_SMOKE_SCENARIO_COUNT = 392`
