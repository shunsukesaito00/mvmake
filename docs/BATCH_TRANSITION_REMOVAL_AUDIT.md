# トランジション一括削除監査（v1.89.0）

最終更新: 2026-07-11（v1.89.0 / MVP 本番品質化）

## 目的

効果タブの**トランジション一括削除**について、全映像/選択トラックスコープ・30 件ストレス・undo が破綻しないことを本番品質として回帰監視する。

## 削除経路

```
MediaPanel（効果タブ）
  → clearBatchTransitions（projectStore）
      → collectBatchTransitionRemovalClipIds（batchTransition.ts）
      → 対象クリップの transition を undefined に（recordHistory=true）
```

一括適用は [BATCH_TRANSITION_AUDIT.md](./BATCH_TRANSITION_AUDIT.md)（v1.86.0）を参照。

## 削除対象（v1.89.0）

| 関数 | 役割 |
|------|------|
| `collectBatchTransitionRemovalClipIds` | 映像トラック上で `transition` を持つ video/image クリップ ID を収集 |
| `clearBatchTransitions` | スコープに応じて transition を除去し件数を返す |

### エッジケース

| ケース | 挙動 |
|--------|------|
| **トランジション未設定** | 対象外（0 件なら no-op、履歴も積まない） |
| **selected-track で未選択** | 0 件 |
| **隣接でないクリップ** | transition があれば削除対象（適用対象とは別集合） |
| **undo** | 一括削除前の transition 状態に復元 |

## ストレステスト

| 項目 | 値 |
|------|-----|
| ベース | `batchTransitionStressSetup`（主21+副11クリップ） |
| 適用済みトランジション | **30** 件（全映像トラック隣接対象） |
| 主トラック削除対象 | **20** 件 |
| 副トラック削除対象 | **10** 件 |
| 投入 | `seedBatchTransitionRemovalStress()` / `loadBatchTransitionRemovalStress` |

E2E プレビューは `vite build --mode e2e`（`.env.e2e`）で `window.__FABLE_E2E__` を有効化。

## 自動検証

| テスト | 内容 |
|--------|------|
| `batchTransition.test.ts` | 削除 ID 収集・スコープ・未設定除外 |
| `batchTransitionRemovalStressSetup.test.ts` | 30 件投入・件数再計算 |
| `projectStore.test.ts` | 30 件削除・副トラックのみ・未選択 0・undo |
| E2E | 30 件 UI 削除・selected-track 10 件・undo |

## 関連ファイル

- `src/utils/batchTransition.ts`
- `src/utils/batchTransitionRemovalStressSetup.ts`
- `src/panels/MediaPanel.tsx`
- `src/store/projectStore.ts` — `clearBatchTransitions`
- `src/e2eBridge.ts`

## 既知の許容差分

| 項目 | 内容 |
|------|------|
| 適用 vs 削除の対象差 | 適用は隣接2枚目以降のみ、削除は transition 属性を持つ全クリップ |
| テキスト/音声 | 対象外 |
