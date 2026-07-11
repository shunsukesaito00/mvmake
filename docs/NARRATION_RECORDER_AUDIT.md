# ブラウザ内ナレーション録音監査（v1.87.0）

最終更新: 2026-07-11（v1.87.0 / MVP 本番品質化）

## 目的

メディアパネルの**ナレーション録音**（MediaRecorder → プレビュー → BGM トラック配置）について、権限拒否・デバイス未検出・空録音・配置 undo が破綻しないことを本番品質として回帰監視する。

## 録音経路

```
NarrationRecorderSection（メディアタブ）
  → getUserMedia → MediaRecorder
  → mergeRecordedChunks → プレビュー
  → createAudioAssetFromBlob（mediaLoader）
  → addMediaAsset + addClipFromMedia（BGM トラック・再生位置）
```

## エラー分類（v1.87.0）

| コード | 条件 | UI |
|--------|------|-----|
| `permission_denied` | NotAllowedError | 再試行 + 権限確認モーダル |
| `no_device` | NotFoundError / OverconstrainedError | 再試行 + 権限確認モーダル |
| `device_busy` | NotReadableError | 再試行 + 権限確認モーダル |
| `empty_recording` | 停止後 Blob が空 | 再試行 |
| `recorder_error` | MediaRecorder.onerror | 再試行 |
| `unsupported` | MediaRecorder / getUserMedia 非対応 | 再試行不可 |

`classifyGetUserMediaError` / `canRetryNarrationError` でユニット回帰。

## 配置と undo

| 操作 | 履歴 |
|------|------|
| `addMediaAsset` | **履歴に積まない**（メディア一覧に残る） |
| `addClipFromMedia` | `pushHistory` — **undo 対象** |

配置 undo はタイムライン上のクリップのみ除去。メディアパネル上の録音ファイルは残る（許容差分）。

## 自動検証

| テスト | 内容 |
|--------|------|
| `narrationRecorder.test.ts` | エラー分類・チャンク結合・ファイル名 |
| `projectStore.test.ts` | BGM 配置・配置 undo |
| E2E | 録音→配置・権限拒否・未検出・空録音・配置 undo |

## E2E モック（`e2e/helpers.ts`）

| 関数 | シミュレート |
|------|-------------|
| `installNarrationRecordingMocks` | 正常録音 |
| `installNarrationPermissionDeniedMock` | NotAllowedError |
| `installNarrationNoDeviceMock` | NotFoundError |
| `installNarrationEmptyRecordingMock` | 空 Blob |

## 関連ファイル

- `src/utils/narrationRecorder.ts`
- `src/components/NarrationRecorderSection.tsx`
- `src/engine/mediaLoader.ts` — `createAudioAssetFromBlob`
- `src/store/projectStore.ts` — `addClipFromMedia`
- `e2e/helpers.ts`

## 既知の許容差分

| 項目 | 内容 |
|------|------|
| 配置 undo | クリップのみ復元。メディアアセットは手動削除が必要 |
| ブラウザ差 | 録音 MIME は `pickRecorderMimeType` で webm 優先 |
