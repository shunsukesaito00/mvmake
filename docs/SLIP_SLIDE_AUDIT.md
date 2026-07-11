# スリップ/スライド編集監査（v2.0.2）

最終更新: 2026-07-11（v2.0.2 / MVP 本番品質化）

## 目的

タイムライン上の **スリップ編集**（素材内オフセット変更）と **スライド編集**（隣接クリップ連動トリム）について、キーフレーム維持・undo・キーボード/ドラッグ操作が破綻しないことを本番品質として回帰監視する。

初回実装は v1.29.0。キーフレーム連動は v1.72.0（[KEYFRAME_EDIT_REGRESSION.md](./KEYFRAME_EDIT_REGRESSION.md)）で回帰済み。今回はストレスセットアップと E2E ブリッジで本番卒業。

## 処理経路

```
キーボード（,/. スリップ、[ / ] スライド） / TimelinePanel Ctrl・Shift+ドラッグ
  → slipSelectedClip / slideSelectedClip（projectStore）
  → computeSlipClip / slideClipOnTrack（slipSlide.ts）
  → updateClip またはトラック clips 一括更新（recordHistory）
```

## ストレス構成（v2.0.2）

| クリップ | start | duration | sourceStart | KF |
|---------|-------|----------|-------------|-----|
| 前 | 0s | **4s** | 0 | なし |
| 中央（選択） | 4s | **2s** | **2** | transform **2** + volume **2** |
| 後 | 6s | **3s** | 0 | なし |

| 操作 | delta | 期待 |
|------|-------|------|
| スリップ | **+1s** | sourceStart 2→3、タイムライン位置不変、KF 時刻維持 |
| スライド | **+0.5s** | 中央 start 4→4.5、前 duration 4→4.5、KF 時刻維持 |

## エッジケース

| ケース | 挙動 |
|--------|------|
| **素材頭/尾超え** | `computeSlipClip` が null、変更なし |
| **隣接なし** | `canSlideClip` false、スライド不可 |
| **ロックトラック** | slip/slide とも拒否 |
| **テキストクリップ** | スリップ不可 |
| **速度 KF 付き動画** | `getSourceOffsetAtLocalTime` で素材端計算 |
| **undo** | `pushHistory` 後に `slipSelectedClip` / `slideSelectedClip` |

## ストレステスト

| 項目 | 値 |
|------|-----|
| クリップ | **3**（隣接動画） |
| 投入 | `seedSlipSlideStress()` / `loadSlipSlideStress` |
| 操作 | `slipClipById` / `slideClipById` |
| 検証 | `getClipSourceStart` / `getClipStartTime` / `getClipTransformKeyframeTimes` |

E2E プレビューは `vite build --mode e2e`（`.env.e2e`）で `window.__FABLE_E2E__` を有効化。

## 自動検証

| テスト | 内容 |
|--------|------|
| `slipSlide.test.ts` | computeSlip / slideClipOnTrack 基本 |
| `keyframeEditRegression.test.ts` | KF 維持（slip/slide） |
| `projectStore.test.ts` | slipSelectedClip / slideSelectedClip |
| `slipSlideStressSetup.test.ts` | seed・スリップ・スライド・undo |
| E2E | ストレス投入・スリップ・スライド+undo（既存: ショートカット UI スモーク） |

## 関連ファイル

- `src/utils/slipSlide.ts`
- `src/utils/slipSlideStressSetup.ts`
- `src/store/projectStore.ts`
- `src/panels/TimelinePanel.tsx`
- `src/App.tsx`（キーボードショートカット）
- `src/e2eBridge.ts`

## 既知の許容差分

| 項目 | 内容 |
|------|------|
| 隣接判定 | `ADJACENCY_TOLERANCE` 0.05s |
| 最小クリップ長 | 0.2s（`MIN_DURATION`） |
| スライド UI | テキストクリップでも隣接があればスライド可（ショートカット E2E 済） |
