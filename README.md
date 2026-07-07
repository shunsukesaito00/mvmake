# FABLE - 結婚式ムービー編集

ブラウザ完結型のタイムライン動画編集Webアプリ。CapCut / Premiere Pro クラスの編集機能を結婚式ムービー制作向けに最適化。

**デモ**: `https://<ユーザー名>.github.io/FABLE/`

> GitHub Pages 有効化後、上記の `<ユーザー名>` を実際のアカウント名に置き換えてください。
> URL は Actions の「Deploy to GitHub Pages」実行結果、または Settings → Pages にも表示されます。

## スクリーンショット

![FABLE エディタ](docs/screenshot.png)

スクリーンショットは `npm run screenshot` で自動生成できます（デモコンテンツを配置したエディタ画面を撮影して `docs/screenshot.png` を更新します）。

## 機能

### タイムライン編集
- マルチトラック（映像×2、テキスト、BGM）
- クリップ移動・トリム・分割・複製・コピー&ペースト
- リップル削除、重なり防止、スナップ
- トラックミュート/ロック
- プレイヘッドドラッグ、タイムラインフィット
- マーカー、In/Out点

### 映像・音声
- 動画・画像・音声インポート（500MB超は警告、合計使用量表示）
- 写真一括配置（スライドショー生成: 表示秒数・トランジション・Ken Burns指定）
- 動画クリップ音量、再生速度（0.25x〜4x）
- 色調補正（明るさ・コントラスト・彩度）
- クロップ、Ken Burns（ズームパン）
- BGMフェードイン/アウト、BGMダッキング（動画音声区間で自動減衰）

### テキスト・効果
- 結婚式プリセット（Opening / プロフィール / Thank you / エンディング）
- テキスト詳細編集（縁取り・影・配置）
- テキストアニメーション（fade / slideUp / typewriter / scaleIn）
- トランジション7種（クロスフェード、フェード、ワイプ、スライド、ズーム）+ ミニプレビュー

### プレビュー・書き出し
- Canvasリアルタイムプレビュー
- プレビュー上のビジュアル編集（移動・スケール・回転、Shiftで15°スナップ）
- セーフエリアガイド、フルスクリーン
- In/Out範囲ループ再生・範囲書き出し
- MP4書き出し（1080p / 720p、品質3段階: 16/8/4Mbps）

### その他
- Undo/Redo（50履歴）
- IndexedDB自動保存、複数プロジェクト管理
- `.fable` ファイルでのバックアップ/共有
- 結婚式テンプレート（オープニング/プロフィール/エンディング）
- プロジェクト設定（解像度、FPS、リップル削除）
- リサイズ可能なパネルレイアウト（設定を保存）
- PWA対応（インストール・オフライン起動）、初回オンボーディングガイド

## 起動

```bash
npm install
npm run dev
```

## テスト

```bash
npm test          # ユニットテスト (Vitest)
npm run test:e2e  # E2Eテスト (Playwright、初回は npx playwright install chromium が必要)
npm run screenshot # README用スクリーンショット生成
```

## デプロイ (GitHub Pages)

main ブランチへの push で `.github/workflows/deploy.yml` が自動実行されます。
リポジトリの Settings → Pages → Source を「GitHub Actions」に設定してください。

## ショートカット

| キー | 操作 |
|------|------|
| Space | 再生/停止 |
| ← / → | フレーム送り |
| I / O | In点 / Out点 |
| M | マーカー追加 |
| S | 分割 |
| Cmd+C/V | コピー/ペースト |
| Cmd+D | 複製 |
| Alt+ドラッグ | クリップを複製して移動 |
| Cmd+Z | Undo |
| F | フルスクリーン |
| G | セーフエリア |

## 技術スタック

Vite + React + TypeScript / Zustand / Tailwind CSS / Canvas 2D / WebCodecs / Web Audio API / IndexedDB
