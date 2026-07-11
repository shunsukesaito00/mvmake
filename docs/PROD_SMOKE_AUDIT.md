# 本番スモーク E2E 監査（v2.2.94）

最終更新: 2026-07-12（v2.2.94 / 本番スモーク 311→314）

## v2.2.94 追加（3件）

| # | シナリオ | 根拠 |
|---|---------|------|
| 312 | RGB R スライダー undo→ルック復元 | 色調補正統合 |
| 313 | In/Out+品質+解像度 JSON往復適用 | 書き出し回帰 |
| 314 | RGB B 制御点追加 undo→ルック復元 | 色調補正統合 |

## 自動検証

- `e2e/basic.spec.ts` — 314 `test(`
- `src/utils/prodSmokeAudit.ts` — `PROD_SMOKE_SCENARIO_COUNT = 314`
