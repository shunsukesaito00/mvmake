# 本番スモーク E2E 監査（v2.5.75）

最終更新: 2026-07-12（v2.5.75 / 本番スモーク 510 シナリオ・テキスト手続き型アニメ3件追加）

## v2.5.75 拡充（507→510）

| 検証項目 | 結果 |
|---------|------|
| `e2e/basic.spec.ts` 件数 | **510**（+3） |
| 追加シナリオ | テキスト手続き型アニメ（スライドアップ / タイプライター / スケールイン+undo） |
| Playwright タイトル重複 | **0**（要確認） |

### 追加シナリオ（v2.5.75）

1. テキスト: スライドアップアニメーションを設定して長さを変更できる
2. テキスト: タイプライターアニメーションを設定できる
3. テキスト: スケールインアニメーションを設定できる

選定根拠: MVP 品質改善バックログ「テキスト・字幕」領域で、手続き型アニメ（slideUp / typewriter / scaleIn）が未カバーだったため。

## v2.5.74 監査（構成整理・件数維持）

| 検証項目 | 結果 |
|---------|------|
| `e2e/basic.spec.ts` 件数 | **507**（維持） |
| Playwright タイトル重複 | **0** |
| double-named-reclick 層（全6経路） | 各 **suffix 3 + plain 3** |
| 孤立テスト断片（`=> {` 残骸） | **0** |

### フェーズ4 完了サマリー（v2.5.68〜v2.5.73）

| 版 | 経路 | 接尾辞 |
|----|------|--------|
| v2.5.68 | user→builtin 組み込みルック2回 | `builtin-double-named-reclick` |
| v2.5.69 | user→builtin ウエディング暖色2回 | `wedding-double-named-reclick` |
| v2.5.70 | user→builtin フィルム風2回 | `film-double-named-reclick` |
| v2.5.71 | builtin→user 組み込みルック2回 | `builtin-double-named-reclick` |
| v2.5.72 | builtin→user ウエディング暖色2回 | `wedding-double-named-reclick` |
| v2.5.73 | builtin→user フィルム風2回 | `film-double-named-reclick` |

各版で「既存 plain → named ボディ差し替え + 旧 suffix 削除 + 末尾 plain 再配置」を実施。件数は常に **507 維持**。

## 自動検証

- `e2e/basic.spec.ts` — 510 `test(`
- `src/utils/prodSmokeAudit.ts` — `PROD_SMOKE_SCENARIO_COUNT = 510`
- `src/utils/prodSmokeAudit.ts` — `PROD_SMOKE_V2575_ADDITIONS`
- `src/utils/prodSmokeAudit.ts` — `auditPhase4DoubleNamedReclickLayers()`（フェーズ4 層監査）
- `src/utils/prodSmokeAudit.test.ts` — `v2.5.75 追加シナリオが basic.spec.ts に含まれる`
- `src/utils/prodSmokeAudit.test.ts` — `v2.5.74 suffix 整理フェーズ4 double-named-reclick 層が整理済みである`
