# 本番スモーク E2E 監査（v2.1.3）

最終更新: 2026-07-11（v2.1.3 / 本番スモーク 22→27 拡充）

## 目的

GitHub Pages 公開環境（`E2E_BASE_URL=https://shunsukesaito00.github.io/mvmake/`）に対し、`npm run test:e2e:prod` で **UI のみ**の回帰を検知する。`window.__FABLE_E2E__` ブリッジは本番ビルドでは無効のため、ストレス投入・store 直接操作は `e2e/editor.spec.ts`（ローカル E2E ビルド）に限定する。

## 実行経路

```
deploy.yml（Pages デプロイ完了後）
  → E2E_BASE_URL=公開 URL
  → playwright test e2e/basic.spec.ts
```

## シナリオ一覧（27 件）

| # | シナリオ | 版 |
|---|---------|-----|
| 1–12 | 基本フロー〜動画再生停止 | 初期〜v1.70 |
| 13–17 | プロジェクト一覧〜ユーザーテンプレート | v2.1.1 |
| 18–22 | 画像インポート〜書き出し Escape 閉じ | v2.1.2 |
| 23 | クリップ分割（S） | **v2.1.3** |
| 24 | In/Out 点（I/O） | **v2.1.3** |
| 25 | 章マーカー追加（M） | **v2.1.3** |
| 26 | Google Fonts 選択 | **v2.1.3** |
| 27 | 映像フェードイン設定 | **v2.1.3** |

## v2.1.3 追加の選定理由

| シナリオ | 根拠 |
|---------|------|
| クリップ分割 | タイムライン編集の中核ショートカット（S） |
| In/Out 点 | 部分書き出し・章区間の基盤（I/O） |
| 章マーカー | 婚礼ムービーの章立て導線（M） |
| Google Fonts | v1.76.0 本番化の UI 回帰 |
| 映像フェード | v1.99.0 本番化のインスペクター回帰 |

## 自動検証

| ファイル | 内容 |
|----------|------|
| `e2e/basic.spec.ts` | 本番スモーク本体（27 `test(`) |
| `src/utils/prodSmokeAudit.ts` | 期待件数定数 |
| `src/utils/prodSmokeAudit.test.ts` | basic 件数・v2.1.1〜v2.1.3 ラベル照合 |
| `src/utils/docSyncAudit.ts` | README / FEATURE_COMPARISON 数値同期 |

## 既知の許容差分

| 項目 | 内容 |
|------|------|
| MP4 バイト検証 | WebCodecs / 環境依存のため未追加 |
| editor 全量 | 193 シナリオはローカル `test:e2e` のみ |
| KF 分割ストレス | transform/音量 KF 再配分は editor.spec に集約 |

## 関連ファイル

- `e2e/basic.spec.ts`
- `e2e/helpers.ts`
- `package.json` — `test:e2e:prod`
- `.github/workflows/deploy.yml`
