# テキスト・SRT 描画監査（Q8）

最終更新: 2026-07-11（v1.76.0 / Phase B Q8）

## 目的

長文折り返し・フォント未ロード・字幕帯極端値について、**プレビューと書き出しが同一経路**で正しく描画されることを確認する。

## 描画経路

| 経路 | エントリ | テキスト描画 | フォント前処理 |
|------|----------|--------------|----------------|
| プレビュー | `PreviewPanel.drawAtTime` | `compositor.renderFrame` → `drawTextClip` | 起動時デフォルト + インスペクター選択時 |
| 書き出し | `exporter.exportProject` | 同上 | **`ensureProjectFontsLoaded`**（ループ前 1 回・失敗時 `FontLoadError`） |

プレビューと書き出しで `drawTextClip` の分岐はない（[RENDER_PATH_AUDIT.md](./RENDER_PATH_AUDIT.md) 参照）。

## 長文折り返し（二段階）

| 段階 | 関数 | 基準 |
|------|------|------|
| SRT インポート（保存時） | `wrapSubtitleText` / `wrapSubtitleLine` | 18 文字/行、句読点優先 |
| 描画時（プレビュー/書き出し） | `wrapTextLinesToCanvasWidth` | Canvas `measureText`、幅 88%（`canvasW * 0.88`） |

インポート時の `\n` は保持され、描画時にさらにキャンバス幅で折り返される。

## 字幕帯（極端値）

| パラメータ | UI 範囲 | compositor スケール |
|------------|---------|---------------------|
| `backgroundPadding` | 0〜40 | `padding * (canvasW / 1920)` |
| `backgroundRadius` | 0〜24 | `radius * (canvasW / 1920)` |
| `fontSize` | インスペクター設定 | `fontSize * (canvasW / 1920)` |

SRT インポート既定: `SUBTITLE_BAND_COLOR`（`rgba(0,0,0,0.6)`）、`verticalAlign: bottom`、`transform.y: 0.88`。

## フォントロード

| タイミング | 関数 | 失敗時 |
|------------|------|--------|
| アプリ起動 | `ensureGoogleFontsLoaded`（デフォルト） | 握りつぶし |
| フォント選択 | `ensureGoogleFontFamily` | UI 読み込み中表示 |
| プロジェクト復元 | `ensureProjectFontsLoaded` | `console.error` |
| **SRT インポート後** | `ensureProjectFontsLoaded` | `console.error` |
| **書き出し前** | `ensureProjectFontsLoaded` | **`FontLoadError` で書き出し中止** |

`normalizeProject` / `normalizeClip` で未知 `fontFamily` は `Noto Sans JP` に正規化（`.fable` 復元時）。

カタログ: `GOOGLE_FONT_OPTIONS`（12 種）。

## SRT / VTT 往復

```
parseSrt → buildTextClipsFromSrtCues → buildSrtFromTextClips / buildVttFromTextClips
```

エクスポートは `clip.text.content` をそのまま出力（インポート折り返しの `\n` 含む）。VTT はタイムスタンプの `,` を `.` に変換。

## 自動検証

| テスト | 内容 |
|--------|------|
| `textRenderRegression.test.ts` | 長文折り返し・字幕帯極端値のレイアウト回帰 |
| `textWrap.test.ts` | `wrapTextLinesToCanvasWidth` |
| `srtRoundTrip.test.ts` | `buildTextClipsFromSrtCues` 経由の長文往復 |
| `googleFonts.test.ts` | `FontLoadError`・`ensureProjectFontsLoaded` |
| `renderPathAudit.test.ts` | 書き出しの `ensureProjectFontsLoaded` 静的検査 |
| E2E | 長文 SRT 往復・VTT エクスポート |

## 関連ファイル

- `src/engine/compositor.ts` — `drawTextClip`
- `src/engine/exporter.ts` — 書き出し前フォントロード
- `src/utils/textWrap.ts` — 折り返し
- `src/utils/textBackground.ts` — 字幕帯
- `src/utils/textLayout.ts` — 行間・縦配置
- `src/utils/googleFonts.ts` — フォントカタログ・ロード
- `src/utils/srtParser.ts` / `srtExporter.ts` — SRT/VTT
- `src/store/projectStore.ts` — `importSrtSubtitles`

## 既知の許容差分

| 項目 | 内容 |
|------|------|
| 縦書き | `verticalAlign` のみ。縦書きレイアウトは未対応 |
| プレビュー未ロードフォント | sans-serif フォールバック表示の可能性（書き出し前に検証） |
| タイムラインラベル | `formatTimelineTextLabel` で平坦化・省略（描画本文とは別） |
