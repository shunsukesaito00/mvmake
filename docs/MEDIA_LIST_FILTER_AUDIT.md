# メディア一覧の検索・ソート監査（v1.85.0）

最終更新: 2026-07-11（v1.85.0 / MVP 本番品質化）

## 目的

メディアパネル左ペインの**名前検索・種類フィルタ・追加順/名前順ソート**について、婚礼アルバム規模（52 件）でも一覧表示・絞り込み・空状態が破綻しないことを本番品質として回帰監視する。

## 一覧経路

```
MediaPanel（メディアタブ）
  → filterAndSortMediaAssets（mediaListFilter.ts）
      → filterMediaAssets（部分一致・種類）
      → sortMediaAssets（追加順 index / 名前 ja ロケール）
  → formatMediaListSummary（件数ラベル）
```

検索・ソートは **UI ローカル state** のみ。プロジェクト undo の対象外（メディア実体は `mediaAssets` に残る）。

## フィルタ/ソート（v1.85.0）

| 関数 | 役割 |
|------|------|
| `filterMediaAssets` | trim + 小文字化した部分一致、種類フィルタ |
| `sortMediaAssets` | `added` は投入順 index、`name` は `localeCompare('ja')` |
| `isMediaListEmpty` | 空結果判定（空状態 UI 用） |
| `formatMediaListSummary` | `N件のメディア` / `N/M件表示` |

### エッジケース

| ケース | 挙動 |
|--------|------|
| **52 件投入** | ストレス seed で種類混在（画像 45 / 音声 5 / 動画 2） |
| **該当なし検索** | 「該当するメディアがありません」+ `0/N件表示` |
| **検索 + 種類** | 両方 AND 条件 |
| **ソート切替** | フィルタ結果に対して再ソート |

## ストレステスト

| 項目 | 値 |
|------|-----|
| 件数 | `MEDIA_LIST_STRESS_COUNT` = **52** |
| 投入 | `seedMediaListStress()` / `window.__FABLE_E2E__.loadMediaListStress` |

## 自動検証

| テスト | 内容 |
|--------|------|
| `mediaListFilter.test.ts` | 基本フィルタ/ソート・空白/大文字小文字 |
| `mediaListStressSetup.test.ts` | 52 件生成・ストア投入・大量絞り込み |
| E2E | 52 件 UI・空状態・種類切替 |

## 関連ファイル

- `src/utils/mediaListFilter.ts`
- `src/utils/mediaListStressSetup.ts`
- `src/panels/MediaPanel.tsx`
- `src/e2eBridge.ts`

## 既知の許容差分

| 項目 | 内容 |
|------|------|
| サムネイル生成 | ストレス資産は Blob のみ（プレースホルダ表示） |
| 検索対象 | ファイル名のみ（メタデータタグは未対応） |
