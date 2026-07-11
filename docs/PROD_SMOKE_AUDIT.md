# 本番スモーク E2E 監査（v2.5.30）

最終更新: 2026-07-12（v2.5.30 / 本番スモーク 477 シナリオ・+3件）

## v2.5.30 追加（3件）

| # | シナリオ | 根拠 |
|---|---------|------|
| 475 | 組み込み→ユーザールック後組み込みルック2回再クリック挟みLUT付き再適用+強度+切替 undo→LUT/ルック復元 | 色調補正統合 |
| 476 | 組み込み→ユーザールック後組み込みルック2回再クリック挟みLUT付き再適用+強度+なし undo→LUT/ルック復元 | 色調補正統合 |
| 477 | 組み込み→ユーザールック後組み込みルック2回再クリック挟みLUT付き再適用+強度+切替+なし undo→LUT/ルック復元 | 色調補正統合 |

※ 既存 builtin-double-named-reclick 3件のタイトルに `・builtin-double-named-reclick` 接尾辞を付与して重複解消（`・builtin-double-reclick` は v2.5.24 経路で使用中）。builtin→user 組み込みルック2回 named-reclick 経路を新規追加。

## 自動検証

- `e2e/basic.spec.ts` — 477 `test(`
- `src/utils/prodSmokeAudit.ts` — `PROD_SMOKE_SCENARIO_COUNT = 477`
