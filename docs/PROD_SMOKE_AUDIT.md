# 本番スモーク E2E 監査（v2.5.34）

最終更新: 2026-07-12（v2.5.34 / 本番スモーク 489 シナリオ・+3件）

## v2.5.34 追加（3件）

| # | シナリオ | 根拠 |
|---|---------|------|
| 487 | 組み込み→ユーザールック後組み込みルック再クリック挟みLUT付き再適用+強度+切替 undo→LUT/ルック復元 | 色調補正統合 |
| 488 | 組み込み→ユーザールック後組み込みルック再クリック挟みLUT付き再適用+強度+なし undo→LUT/ルック復元 | 色調補正統合 |
| 489 | 組み込み→ユーザールック後組み込みルック再クリック挟みLUT付き再適用+強度+切替+なし undo→LUT/ルック復元 | 色調補正統合 |

※ 既存 builtin-named-reclick 3件（builtin→user 経路）のタイトルに `・builtin-named-reclick` 接尾辞を付与して重複解消。builtin→user 組み込みルック単一再クリック named-reclick 経路を新規追加。

## 自動検証

- `e2e/basic.spec.ts` — 489 `test(`
- `src/utils/prodSmokeAudit.ts` — `PROD_SMOKE_SCENARIO_COUNT = 489`
