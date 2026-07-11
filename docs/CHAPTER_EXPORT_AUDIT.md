# 章マーカー一括 ZIP 書き出し監査（v1.80.0）

最終更新: 2026-07-11（v1.80.0 / MVP 本番品質化）

## 目的

全章区間を個別 MP4 化して ZIP ダウンロードする婚礼ワークフローについて、**大容量プロジェクト（章 6・クリップ 100）**でも UI・エラー・メモリ挙動が破綻しないことを確認する。

## 書き出し経路

```
ExportButton.handleBatchChapterExport
  → buildChapterExportEntries（章区間・ファイル名）
  → exportAllChaptersToZip（章ごと逐次 MP4 → fflate ZIP）
      → exportProject（各章: startTime + duration、WebCodecs）
```

単一章書き出し（In/Out 範囲）と **同一の `exportProject`** を章ごとに呼び出す。プレビュー経路は関与しない。

## メモリ方針（v1.25.0 以降）

| 方式 | 内容 |
|------|------|
| **採用** | `exportAllChaptersToZip` が章ごとに `zippable[filename]` へ逐次追加。中間 `Blob[]` を保持しない |
| **v1.80.0** | ユニットテストで同時保持 Blob 数 ≤ 1 を回帰監視 |

## エラーハンドリング（v1.80.0）

| 種別 | クラス / 表示 | 内容 |
|------|----------------|------|
| 章 MP4 失敗 | `ChapterBatchExportError` | 章名・何章目かをメッセージに含める |
| ZIP 生成失敗 | `ChapterZipBuildError` | 処理済み章数を含む |
| キャンセル | `AbortError` | 一括書き出しコンテキストでトースト・パネル表示 |
| 章なし | Toast | `書き出し可能な章がありません` |
| UI タイトル | `formatExportError(..., 'batch')` | 「一括書き出しに失敗しました」 |

## ストレステストプロジェクト

| プロファイル | 生成 | 用途 |
|--------------|------|------|
| **stress** | `createChapterExportStressProject()` | 章 6・クリップ 100・尺 10 分。UI / 閾値検証 |
| **e2e** | `createChapterExportE2eProject()` | 章 6・クリップ 58・尺 ~13 秒。WebCodecs ZIP スモーク |

DEV 時のみ `window.__FABLE_E2E__`（`src/e2eBridge.ts`）から Playwright が投入可能。

### stress プロファイル既定値

| 項目 | 値 |
|------|-----|
| ベース | `createStressTestProject()` |
| 映像 | 75 |
| テキスト | 20 |
| BGM | 5 |
| **合計クリップ** | **100** |
| 章マーカー | 6（均等配置） |

## 自動検証

| テスト | 内容 |
|--------|------|
| `chapterBatchExport.test.ts` | 逐次 ZIP・`ChapterBatchExportError`・キャンセル・空章 |
| `chapterExportStressProject.test.ts` | 50+ クリップ / 6 章閾値 |
| `exportUx.test.ts` | 一括エラー文言 |
| E2E `editor.spec.ts` | 大容量 UI・ZIP キャンセル・短尺 ZIP ダウンロード（エンコーダ対応時） |

## 関連ファイル

- `src/utils/chapterBatchExport.ts`
- `src/components/ExportButton.tsx`
- `src/utils/exportUx.ts`
- `src/engine/chapterExportStressProject.ts`
- `src/e2eBridge.ts`
- `e2e/helpers.ts` — `loadChapterExportStressProject` / `loadChapterExportE2eProject`

## 既知の許容差分

| 項目 | 内容 |
|------|------|
| 書き出し時間 | 章数 × 尺 × 解像度に比例。stress プロファイルのフル ZIP は CI では実行しない |
| プレースホルダー資産 | stress / e2e プロジェクトは `blob:stress-*` URL。実 MP4 書き出し E2E は通常クリップ（テキスト等）で実施 |
| エンコーダ非対応 | Playwright Chromium では H.264 非対応のことがある。ZIP 実ダウンロードテストは `isConfigSupported` でスキップ |
