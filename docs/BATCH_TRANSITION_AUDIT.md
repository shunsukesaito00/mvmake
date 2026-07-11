# 隣接クリップへの一括トランジション監査（v1.86.0）

最終更新: 2026-07-11（v1.86.0 / MVP 本番品質化）

## 目的

効果タブの**隣接クリップへ一括適用**について、複数映像トラック・大量隣接列でもスコープ切替・適用・undo が破綻しないことを本番品質として回帰監視する。

## 適用経路

```
MediaPanel（効果タブ）
  → applyBatchTransitions（projectStore）
      → collectBatchTransitionClipIds（batchTransition.ts）
      → 各対象クリップへ transition を設定（recordHistory=true）
```

一括削除は `clearBatchTransitions` → `collectBatchTransitionRemovalClipIds`（別経路）。

## 隣接判定（v1.86.0）

| 関数 | 役割 |
|------|------|
| `getAdjacentTransitionTargets` | 同一トラック上・時系列2枚目以降で前クリップ終端と隙間 ≤ 0.05 秒 |
| `collectBatchTransitionClipIds` | `selected-track` / `all-video-tracks` スコープで ID 収集 |
| `isValidBatchTransition` | duration > 0 |

### エッジケース

| ケース | 挙動 |
|--------|------|
| **隙間 > 0.05 秒** | 隣接とみなさない |
| **隙間 ≤ 0.05 秒** | 隣接とみなす |
| **selected-track で未選択** | 0 件（トーストエラー） |
| **undo** | 一括適用前の transition 状態に復元 |

## ストレステスト

| 項目 | 値 |
|------|-----|
| 主トラッククリップ | `BATCH_TRANSITION_STRESS_PRIMARY_CLIPS` = **21**（対象 20） |
| 副トラッククリップ | `BATCH_TRANSITION_STRESS_SECONDARY_CLIPS` = **11**（対象 10） |
| 全映像トラック対象 | **30** 件 |
| 投入 | `seedBatchTransitionStress()` / `loadBatchTransitionStress` |

## 自動検証

| テスト | 内容 |
|--------|------|
| `batchTransition.test.ts` | 隣接判定・隙間許容・複数トラック |
| `batchTransitionStressSetup.test.ts` | ストレス生成・スコープ件数 |
| `projectStore.test.ts` | 30 件適用・副トラックのみ・undo |
| E2E | 30 件 UI・selected-track 10 件・undo |

## 関連ファイル

- `src/utils/batchTransition.ts`
- `src/utils/batchTransitionStressSetup.ts`
- `src/panels/MediaPanel.tsx`
- `src/store/projectStore.ts` — `applyBatchTransitions` / `clearBatchTransitions`
- `src/e2eBridge.ts`

## 既知の許容差分

| 項目 | 内容 |
|------|------|
| 対象クリップ | 映像トラック上の video/image のみ（テキストは対象外） |
| 1 枚目 | トランジションは常に 2 枚目以降（前クリップとの接続） |
