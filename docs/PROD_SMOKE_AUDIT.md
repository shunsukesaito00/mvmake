# 本番スモーク E2E 監査（v2.2.97）

最終更新: 2026-07-12（v2.2.97 / 本番スモーク 320→323）

## v2.2.97 追加（3件）

| # | シナリオ | 根拠 |
|---|---------|------|
| 321 | RGB カーブリセット undo→ルック復元 | 色調補正統合 |
| 322 | In/Out+標準+720p JSON往復適用 | 書き出し回帰 |
| 323 | RGB G 制御点ドラッグ undo→ルック復元 | 色調補正統合 |

## 自動検証

- `e2e/basic.spec.ts` — 323 `test(`
- `src/utils/prodSmokeAudit.ts` — `PROD_SMOKE_SCENARIO_COUNT = 323`
