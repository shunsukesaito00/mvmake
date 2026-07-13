# ドキュメント同期監査（Q11）

最終更新: 2026-07-13（v2.9.4 / Phase E 完了レビュー反映）

## 目的

`README.md`・`docs/FEATURE_COMPARISON.md`・`AGENTS.md` と `package.json` / テストコードの**数値・バージョン・監査 doc 参照**の乖離を CI で検知する。

## 同期対象

| 項目 | 正本（実測） | ドキュメント記載箇所 |
|------|--------------|----------------------|
| バージョン | `package.json` `version` | README・FEATURE_COMPARISON サマリー |
| ユニットテスト件数 | `src/**/*.test.ts` の `it` / `test` + `it.each` 展開 | FEATURE_COMPARISON サマリー |
| E2E 件数 | `e2e/basic.spec.ts` + `e2e/editor.spec.ts` の `test(` | FEATURE_COMPARISON サマリー |
| 本番スモーク | `e2e/basic.spec.ts`（= `test:e2e:prod`。**editor は含まない**） | README・FEATURE_COMPARISON |
| 実装済み機能数 | FEATURE_COMPARISON「機能比較マトリクス」のデータ行数 | サマリー表 |
| MVP 要磨り込み | マトリクス備考の `(MVP)` 件数 | サマリー表・完成度見直し節 |
| 監査 doc 一覧 | `docs/*_AUDIT.md` の存在 | `AGENTS.md` 参照 |

## 自動検証

| ファイル | 内容 |
|----------|------|
| `src/utils/docSyncAudit.ts` | パース・件数集計・乖離検知ヘルパー |
| `src/utils/docSyncAudit.test.ts` | `npm test` で README / FEATURE_COMPARISON / AGENTS と実測を照合 |

`npm test` の build ジョブに含まれるため、ドキュメントだけ更新して数値がずれると CI が失敗する。

## Q8〜Q10 で卒業した MVP 表記（v1.79.0）

| 版 | マトリクス更新 |
|----|----------------|
| Q8 | Google Fonts・SRT/VTT・テキスト複数行・行間/縦配置・字幕帯の `(MVP)` を削除 |
| Q9 | オンボーディング・サンプル・コーチマークはもともと本番品質表記（変更なし） |
| Q10 | 結婚式テキストプリセット備考にカテゴリ・よく使う（v1.78.0）を追記 |

## 既知の許容差分

| 項目 | 内容 |
|------|------|
| `RELEASE_NOTES.md` | 履歴用。件数は当時のスナップショットのまま（自動検証対象外） |
| Premiere 同等性マトリクス | v1.68.0 時点の定性評価。数値サマリーとは別系統 |
| ユニットテスト下限 | `docSyncAudit.test.ts` は件数が減った場合も検知するため下限アサートを併用 |
| E2E basic / editor 分担 | 合計 1007・本番 781。v3.0.0 で Phase E E1〜E3 の 4 件を basic へ移植済み。残り Phase E 回帰は editor（226） |

## 関連ファイル

- `src/utils/docSyncAudit.ts`
- `src/utils/docSyncAudit.test.ts`
- `README.md`
- `docs/FEATURE_COMPARISON.md`
- `AGENTS.md`
- `package.json`
