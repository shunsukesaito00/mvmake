# 長尺パフォーマンス監査（Q7）

最終更新: 2026-07-13（v3.11.0 / Phase G G19）

## 目的

10 分・約 100 クリップ相当の婚礼ムービー編集で、タイムライン操作・プレビュー・書き出しが**実用範囲内**であることを確認する。

## ストレステストプロジェクト

| 項目 | 値 |
|------|-----|
| 生成 | `createStressTestProject()`（`src/engine/stressTestProject.ts`） |
| 映像クリップ | 75（各 8 秒・連続配置・crossfade） |
| テキストクリップ | 20 |
| BGM クリップ | 5 |
| **合計クリップ** | **100** |
| **尺** | **600 秒（10 分）** |

Blob/Canvas を使わない軽量プレースホルダー資産のため、ユニット計測に最適。手動ブラウザ検証時は写真を差し替えて利用可能。

## ユニット計測結果（Vitest / CI 閾値）

`src/utils/performanceBenchmark.test.ts` で回帰監視。

| 処理 | 条件 | 閾値（合計） |
|------|------|-------------|
| `getProjectDuration` | 100 回 | < 5 ms |
| `getDuckingIntervals` | 50 回 | < 15 ms |
| `getAudioClipsFromProject` | 50 回 | < 10 ms |
| `getCandidateVisualClipIndices` | 600 時刻サンプル | < 20 ms |
| `computeTimelineScrollLeftForTime` | 300 回 | < 25 ms |

いずれも **100 クリップ / 10 分** プロジェクトで計測。CI マシン差を見込んだ緩い上限。

## v1.75.0 最適化

### compositor: 候補クリップの絞り込み

**問題**: `getTrackLayersAtTime` が毎フレーム全クリップを走査（100 クリップ × 30 fps 書き出しで数百万回ループ）。

**対策**: `getCandidateVisualClipIndices`（`src/utils/visualClipTimeline.ts`）で二分探索 + 前後 2 クリップのみ評価。トランジション境界もカバー。

### 既存最適化（再掲）

| 箇所 | 内容 |
|------|------|
| `sortedVisualClipsCache` | トラック内クリップの sort 結果を WeakMap キャッシュ |
| `Playhead` 分離 | 再生中の `currentTime` 更新でタイムライン全クリップを再レンダーしない |
| v1.69 再生ループ | `usePlayback` 単一化・描画 RAF 一本化 |

## ボトルネック（既知・許容）

| 領域 | 内容 | 優先度 |
|------|------|--------|
| **書き出し** | 10 分 × 30 fps = 18,000 フレームの `renderFrame` + WebCodecs。環境依存で数分かかりうる | 許容（オフライン処理） |
| **ピクセルグレード** | LUT/トーン/RGB 適用クリップは `getImageData` コスト大。長尺でも**アクティブ 1〜2 層**のみ | 中 |
| **IndexedDB 自動保存** | 数百 MB メディアで遅延（v1.6.1 で UX 改善済） | 中 |
| **1080p 実動画 FPS** | v1.69 で構造改善済。**手動シーク型再生**がボトルネック（Phase G / G17, G19） | **高** |
| **書き出し信頼性** | シークハング・メモリ・コーデック非対応（Phase G / G16, G18） | **高** |
| **タイムライン DOM** | 100 クリップの DOM ノードはスクロール仮想化なし。現状は操作可能範囲 | 低 |

## 手動検証手順（ブラウザ）

1. コンソールまたはテスト用コードで `createStressTestProject()` をストアへ投入
2. タイムラインズーム・スクロール・クリップ選択が 1 秒以内に応答することを確認
3. Space 再生 → K 停止（v1.69 回帰）
4. （任意）書き出しスモーク: 対応環境で 30 秒 In/Out 区間を書き出し

## Phase G 連携（2026-07-13）

ユーザー報告「書き出し失敗」「再生カクつき」の原因分析と改善ロードマップは [FEATURE_COMPARISON.md — Phase G](./FEATURE_COMPARISON.md#phase-g--信頼性再生品質v39-以降) を正本とする。

| 領域 | 優先 ID | 要点 |
|------|---------|------|
| 書き出し信頼性 | G16, G18 | v3.10.0 で部分ミックス・ZIP ストリーミング・メモリ警告完了 |
| プレビュー | G17, G19, G20 | v3.11.0 でネイティブデコード完了。再生中 UI 負荷は G20 |

## 関連ファイル

- `src/engine/stressTestProject.ts` — ストレスプロジェクト生成
- `src/utils/performanceBenchmark.test.ts` — 計測・閾値
- `src/utils/visualClipTimeline.ts` — 候補クリップ index
- `src/engine/compositor.ts` — 描画ループ
- `src/panels/TimelinePanel.tsx` — Playhead 分離
