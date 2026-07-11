# 本番スモーク E2E 監査（v2.5.37）

最終更新: 2026-07-12（v2.5.37 / 本番スモーク 498 シナリオ・+3件）

## v2.5.37 追加（3件）

| # | シナリオ | 根拠 |
|---|---------|------|
| 496 | ユーザールック→組み込みルック後ウエディング暖色2回再クリック挟みLUT付き再適用+強度+切替 undo→LUT/ルック復元 | 色調補正統合 |
| 497 | ユーザールック→組み込みルック後ウエディング暖色2回再クリック挟みLUT付き再適用+強度+なし undo→LUT/ルック復元 | 色調補正統合 |
| 498 | ユーザールック→組み込みルック後ウエディング暖色2回再クリック挟みLUT付き再適用+強度+切替+なし undo→LUT/ルック復元 | 色調補正統合 |

※ 既存 wedding-double-named-reclick 3件（user→builtin 経路）のタイトルに `・wedding-double-named-reclick` 接尾辞を付与して重複解消。user→builtin ウエディング暖色2回再クリック named-reclick 経路を新規追加。

## 自動検証

- `e2e/basic.spec.ts` — 498 `test(`
- `src/utils/prodSmokeAudit.ts` — `PROD_SMOKE_SCENARIO_COUNT = 498`
