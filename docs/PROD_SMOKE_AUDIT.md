# 本番スモーク E2E 監査（v2.2.71）

最終更新: 2026-07-11（v2.2.71 / 本番スモーク 242→245）

## v2.2.71 追加（3件）

| # | シナリオ | 根拠 |
|---|---------|------|
| 243 | RGB カーブ制御点追加（色調補正） | editor.spec 最終移植 |
| 244 | 書き出しプリセット JSON 往復 | editor.spec 最終移植 |
| 245 | RGB カーブ G チャンネル | 色調補正拡張 |

## 自動検証

- `e2e/basic.spec.ts` — 245 `test(`
- `src/utils/prodSmokeAudit.ts` — `PROD_SMOKE_SCENARIO_COUNT = 245`
