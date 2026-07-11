# マーカー編集 UI 監査（v1.83.0）

最終更新: 2026-07-11（v1.83.0 / MVP 本番品質化）

## 目的

章マーカー・ビートマーカーの**ラベル/時刻編集**と**タイムライン上ドラッグ移動**について、構造化ウェディングの複数章マーカーでも編集・削除・undo・章区間連動が破綻しないことを本番品質として回帰監視する。

## 編集経路

```
タイムラインルーラー（マーカーハンドル）
  → startMarkerDrag → updateMarker（ドラッグ中 recordHistory=false、開始時 pushHistory）
インスペクター MarkerInspectorSection
  → updateMarker（ラベル/時刻、recordHistory=true）
  → seek（再生位置へ移動）
  → removeMarker（削除）
```

章区間書き出し（[CHAPTER_RANGE_EXPORT_AUDIT.md](./CHAPTER_RANGE_EXPORT_AUDIT.md)）は `getMarkerChapterRanges` が章マーカーの `time` に依存。時刻変更後も `setInOutFromMarker` が有効区間を返すことを検証する。

## 時刻正規化（v1.83.0）

| 関数 | 役割 |
|------|------|
| `clampMarkerTime` | 0〜プロジェクト尺にクランプ |
| `normalizeMarkerUpdates` | `updateMarker` 投入前の時刻正規化 |
| `resolveMarkerDragTime` | ドラッグ時のクランプ + スナップ |

### エッジケース

| ケース | 挙動 |
|--------|------|
| **時刻がプロジェクト尺超** | インスペクター入力・ストア更新とも尺でクランプ |
| **無効マーカー ID** | `updateMarker` は no-op（履歴も積まない） |
| **章マーカー時刻変更** | 章区間の start が更新され `setInOutFromMarker` 継続 |
| **ビートマーカー** | 章区間計算から除外（`filterChapterMarkers`） |
| **undo** | ラベル/時刻編集・削除の双方で復元 |

## ストレステスト

| 項目 | 値 |
|------|-----|
| テンプレ | `structured-wedding` |
| 章マーカー数 | `STRUCTURED_WEDDING_CHAPTER_MARKER_COUNT` = **5** |
| 投入 | `seedMarkerEditStress()` / `window.__FABLE_E2E__.loadMarkerEditStress` |

## 自動検証

| テスト | 内容 |
|--------|------|
| `markerEdit.test.ts` | クランプ・正規化・ドラッグスナップ |
| `projectStore.test.ts` | クランプ・無効 ID・undo・章区間連動・削除 undo |
| E2E | ラベル undo・インスペクター削除・境界時刻 + seek |

## 関連ファイル

- `src/utils/markerEdit.ts`
- `src/utils/markerStressSetup.ts`
- `src/components/MarkerInspectorSection.tsx`
- `src/panels/TimelinePanel.tsx` — マーカードラッグ
- `src/store/projectStore.ts` — `updateMarker` / `removeMarker`
- `src/utils/markerExport.ts` — 章区間算出
- `src/e2eBridge.ts`

## 既知の許容差分

| 項目 | 内容 |
|------|------|
| ダブルクリック削除 | 確認ダイアログなし（Premiere 同様の即時削除） |
| ビートマーカーラベル | 手動編集可だが章書き出し UI には出ない |
