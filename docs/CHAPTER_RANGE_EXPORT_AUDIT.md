# 章マーカー区間の部分書き出し監査（v1.81.0）

最終更新: 2026-07-11（v1.81.0 / MVP 本番品質化）

## 目的

書き出しダイアログから章区間を In/Out に設定し、**範囲 MP4** を書き出す婚礼ワークフローについて、章境界・極短章・キャンセルのエッジケースを本番品質として回帰監視する。

## 書き出し経路

```
ExportButton.handleSetChapterInOut
  → setInOutFromMarker（章区間 → inPoint / outPoint）
ExportButton.handleExport
  → resolveRangeExportParams（In/Out → startTime + duration）
  → exportProject（startTime オフセット付き WebCodecs）
```

章一括 ZIP（[CHAPTER_EXPORT_AUDIT.md](./CHAPTER_EXPORT_AUDIT.md)）とは別経路。同一の `exportProject` を **1 区間** に対して呼ぶ。

## 範囲解決（v1.81.0）

| 関数 | 役割 |
|------|------|
| `resolveRangeExportParams` | In/Out とプロジェクト尺から `startTime` / `duration` を算出 |
| `isExportableChapterRange` | 章区間が最短尺（0.01 秒）以上か |
| `findChapterRangeByMarkerId` | マーカー ID → 章区間 |
| `getChapterRangeAudioSampleRange` | exporter と同一式のオーディオサンプル範囲 |

### エッジケース

| ケース | 挙動 |
|--------|------|
| **先頭章** | `start = 0`、次マーカーまで |
| **末尾章** | 最終マーカーから `projectDuration` まで |
| **極短章**（&lt; 0.01 秒） | `setInOutFromMarker` が false、書き出しも拒否 |
| **In のみ / Out のみ** | 未設定側は 0 またはプロジェクト末尾 |
| **キャンセル** | `AbortSignal` → 単一書き出しと同じ UX |

## エラーメッセージ

| 状況 | 表示 |
|------|------|
| 範囲が短すぎる | `書き出し範囲が短すぎます。In/Out または章区間を確認してください` |
| 章 In/Out 失敗 | `章区間を In/Out に設定できませんでした` |
| キャンセル | `書き出しをキャンセルしました` |

## 自動検証

| テスト | 内容 |
|--------|------|
| `chapterRangeExport.test.ts` | 境界・極短章・In/Out 片方・オーディオサンプル |
| `projectStore.test.ts` | `setInOutFromMarker` 先頭/末尾/極短章 |
| E2E `editor.spec.ts` | 先頭・末尾章 UI、範囲キャンセル、範囲 MP4 スモーク |

## 関連ファイル

- `src/utils/chapterRangeExport.ts`
- `src/utils/markerExport.ts`
- `src/utils/audioPathAudit.ts` — `getExportAudioSampleRange`
- `src/store/projectStore.ts` — `setInOutFromMarker`
- `src/components/ExportButton.tsx`
- `src/engine/exporter.ts`

## 既知の許容差分

| 項目 | 内容 |
|------|------|
| 章尺とクリップ配置 | テンプレの写真ガイドは章内に収まる想定。手動でマーカーを詰めた極短章は UI で拒否 |
| エンコーダ非対応 | 範囲 MP4 の実ダウンロード E2E は `isConfigSupported` でスキップ |
