# FABLE

ブラウザ完結型の動画編集アプリ(ウェディングムービー向け)。サーバーなし、全処理クライアントサイド。

## 技術スタック

- React 19 + TypeScript + Vite 8(`npm run dev` / `build` / `lint`)
- 状態管理: Zustand(`src/store/projectStore.ts` の `useProjectStore` 一箇所のみ)
- スタイル: Tailwind CSS 4(`@tailwindcss/vite` プラグイン経由)
- Lint: oxlint(ESLint ではない)
- 動画書き出し: WebCodecs API + `mp4-muxer`
- 永続化: IndexedDB(`src/persistence/db.ts`、Blob ごと保存)

## ディレクトリ構成

| パス | 役割 |
|---|---|
| `src/types/project.ts` | 全ドメイン型。`Project` → `Track[]` → `Clip[]`(video/image/audio/text の判別可能ユニオン)、`MediaAsset`、デフォルト値、`TEXT_PRESETS` |
| `src/store/projectStore.ts` | 単一ストア。プロジェクト状態・再生状態・選択・タイムラインドラッグ・書き出し進捗と全アクション |
| `src/engine/compositor.ts` | Canvas 2D への `renderFrame()`。トランジション・Ken Burns・テキスト描画 |
| `src/engine/audioEngine.ts` | Web Audio 再生 + `mixAudioOffline()`(書き出し用オフラインミックス) |
| `src/engine/exporter.ts` | `exportProject()`。WebCodecs でエンコードし mp4-muxer で MP4 化 |
| `src/engine/mediaLoader.ts` | File → `MediaAsset` 変換(duration・サムネイル・波形の抽出) |
| `src/engine/demoProject.ts` | `createDemoProject()`。サンプルプロジェクト（6 映像・BGM・3 章・33 秒） |
| `src/engine/stressTestProject.ts` | `createStressTestProject()`。10 分・100 クリップのパフォーマンス計測用プロジェクト |
| `src/engine/chapterExportStressProject.ts` | `createChapterExportStressProject()`。章 6・100 クリップの章 ZIP 検証用 |
| `src/persistence/db.ts` | IndexedDB への保存・復元・プロジェクト一覧/複製/削除 |
| `src/persistence/projectFile.ts` | `.fable` ファイル(JSON+メディアZIP)のエクスポート/インポート |
| `src/hooks/` | `usePlayback`(再生ループ・`PlaybackProvider` 経由で単一マウント)、`useAutoSave` / `useProjectRestore`、`usePanelSize`(リサイズ可能レイアウト) |
| `src/utils/` | `createId()`(uuid)、`formatTime` / `snapTime` / `getProjectDuration`、`docSyncAudit`（ドキュメント数値乖離検知） |
| `src/layout/AppLayout.tsx` | 全体レイアウト。メディア(左)・プレビュー(中央)・インスペクタ(右)・タイムライン(下)の 4 ペイン |
| `src/panels/` | `MediaPanel` / `PreviewPanel` / `InspectorPanel` / `TimelinePanel` |
| `src/components/` | `Toolbar`、`ExportButton`、モーダル類、`ToastContainer`、共通 UI(`ui.tsx` / `icons.tsx`) |
| `src/store/toastStore.ts` | トースト通知用ストア |
| `e2e/` | Playwright E2E テスト(`npm run test:e2e`、本番スモークは `test:e2e:prod`) |
| `scripts/` | README スクリーンショット生成(`npm run screenshot`)、maskable アイコン生成 |
| `.github/workflows/` | `ci.yml`(lint・test・build・E2E)、`deploy.yml`(Pages デプロイ + 本番スモーク) |

### 品質監査ドキュメント（`docs/*_AUDIT.md`）

| ファイル | 内容 |
|----------|------|
| `docs/RENDER_PATH_AUDIT.md` | プレビュー/書き出し compositor 経路（Q3） |
| `docs/COLOR_STACK_AUDIT.md` | 色調スタック複合適用（Q5） |
| `docs/AUDIO_STACK_AUDIT.md` | オーディオミックス書き出し一致（Q6） |
| `docs/PERFORMANCE_AUDIT.md` | 長尺パフォーマンス計測（Q7） |
| `docs/TEXT_SRT_AUDIT.md` | テキスト・SRT・フォント描画（Q8） |
| `docs/ONBOARDING_AUDIT.md` | 初回体験・15 分ジャーニー（Q9） |
| `docs/PRESET_CATALOG_AUDIT.md` | プリセットカタログ・よく使う（Q10） |
| `docs/DOC_SYNC_AUDIT.md` | README / FEATURE_COMPARISON / AGENTS 同期（Q11） |
| `docs/CHAPTER_EXPORT_AUDIT.md` | 章マーカー一括 ZIP 書き出し（v1.80.0） |
| `docs/CHAPTER_RANGE_EXPORT_AUDIT.md` | 章区間の部分書き出し（v1.81.0） |

`src/utils/docSyncAudit.test.ts` が上記一覧の存在と AGENTS 参照を `npm test` で検証する。

エディタ UI は実装済み。`src/App.tsx` はキーボードショートカット(再生・undo/redo・コピペ・分割・イン/アウト点など)の登録と `AppLayout` の描画を担う。

## ドメインモデルの要点

- 時間の単位はすべて秒(number)。クリップは `startTime` / `duration`(タイムライン上)と `sourceStart` / `sourceDuration`(素材内)を持つ
- `Transform` の `x` / `y` は 0〜1 の正規化座標(0.5 が中央)
- トラックは `video` / `text` / `audio` の 3 種。クリップ型とトラック型は対応必須
- `MediaAsset.url` は `URL.createObjectURL(blob)` の結果。破棄時は revoke が必要
- トランジション: `crossfade` / `fadeBlack` / `fadeWhite` / `wipe` / `slideLeft` / `slideRight` / `zoom`
- テキストアニメーション: `fadeIn` / `fadeOut` / `slideUp` / `typewriter` / `scaleIn` / `none`
- `AudioClip.ducking`: BGMダッキング設定(動画音声区間で自動減衰)。区間計算は `getDuckingIntervals()`

## 規約

- 状態変更は必ず `useProjectStore` のアクション経由。コンポーネントから project を直接 mutate しない
- 新しい型は `src/types/project.ts` に追加する
- ID 生成は `createId()` を使う
- セミコロンなしのコードスタイル(既存に合わせる)

## 応答の締めくくり

- 毎回のプロンプト実行の最後に、今回の作業内容と残タスクを踏まえて「次回実行すべきこと」を考え、そのままコピペして使えるプロンプト文として提示する
- 提示形式は応答末尾に「### 次回のプロンプト案」という見出しを置き、その下にプロンプト文をコードブロックで記載する
