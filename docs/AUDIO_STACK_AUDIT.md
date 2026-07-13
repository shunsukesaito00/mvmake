# オーディオミックス監査（Q6）

最終更新: 2026-07-11（v1.74.0 / Phase B Q6）

## 結論

**本編プレビューと MP4 書き出しは同一の音声シグナルチェーン**を通る。ダッキング・EQ・ノイズ除去・音量キーフレームは `audioEngine.ts` と `mixAudioOffline()` で共有ユーティリティを呼び出す。

## シグナルチェーン（本編）

```
BufferSource
  → connectNoiseReductionChain
  → connectEqChain
  → scheduleVolumeAutomation（clipGain）
  → applyDucking（duckGain、AudioClip + ducking.enabled のみ）
  → master / OfflineAudioContext.destination
```

| 段階 | プレビュー | 書き出し |
|------|------------|----------|
| エントリ | `AudioEngine.scheduleClip` | `mixAudioOffline` |
| クリップ列挙 | `getAudioClipsFromProject` | 同上 |
| ダッキング区間 | `getDuckingIntervals` | 同上 |
| 音量カーブ | `scheduleVolumeAutomation` | 同上 |
| 動画速度 KF | `scheduleSpeedAutomation` + `getSourceOffsetAtLocalTime` | 同上 |

## プレビュー / 書き出しの分岐

| 項目 | プレビュー | 書き出し |
|------|------------|----------|
| コンテキスト | `AudioContext`（リアルタイム） | `OfflineAudioContext` |
| スケジュール開始 | `fromTime` から部分再生 | `t=0` からフルレンダー |
| 章 In/Out | — | `mixAudioOffline(duration, { startTime })` で必要区間のみミックス（v3.10.0） |
| ダッキング基準 | `playbackStart = fromTime` | `playbackStart = 0` |

章書き出しは映像と同様、オフラインで先頭からミックスした後に exporter がスライスする（`getExportAudioSampleRange`）。

## 既知の仕様

- **ダッキング**は `AudioClip`（BGM 等）のみ。`VideoClip` の音声はダッキング対象区間の算出に使われる
- **音量キーフレーム**がある場合、`fadeIn` / `fadeOut` は無視される（KF が優先）
- **色相**と同様、EQ/NR 無効時はバイパス Gain で接続

## テストカバレッジ

| 領域 | ファイル |
|------|----------|
| ダッキングスケジュール | `audioDucking.test.ts` |
| 音量オートメーション | `audioMixRegression.test.ts` |
| オフラインミックス | `audioMixRegression.test.ts`（Mock OfflineAudioContext） |
| 経路監査 | `audioPathAudit.ts` |
| ダッキング区間 | `clipUtils.test.ts` |
| EQ/NR 設定 | `audioEq.test.ts`, `audioNoiseReduction.test.ts` |
| 音量 KF 補間 | `volumeKeyframes.test.ts` |
| E2E UI | `editor.spec.ts`（EQ・NR・ダッキング・volume KF） |

## 関連ファイル

- `src/engine/audioEngine.ts` — プレビュー + `mixAudioOffline`
- `src/engine/exporter.ts` — 音声スライス・AAC エンコード
- `src/utils/audioDucking.ts` — ダッキングゲイン
- `src/utils/volumeKeyframes.ts` — 音量カーブ
- `src/utils/audioPathAudit.ts` — 監査定数
- `docs/RENDER_PATH_AUDIT.md` — 映像経路監査
