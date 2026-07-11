# 本番スモーク E2E 監査（v2.4.8）

最終更新: 2026-07-12（v2.4.8 / 本番スモーク 383→386）

## v2.4.8 追加（3件）

| # | シナリオ | 根拠 |
|---|---------|------|
| 384 | 組み込みルック+LUT強度+切替 undo→LUT/ルック復元 | 色調補正統合 |
| 385 | LUTのみ+強度+なし選択 undo→LUT復元 | 色調補正統合 |
| 386 | ユーザールック+LUT強度+切替 undo→ルック/LUT復元 | 色調補正統合 |

## 自動検証

- `e2e/basic.spec.ts` — 386 `test(`
- `src/utils/prodSmokeAudit.ts` — `PROD_SMOKE_SCENARIO_COUNT = 386`
