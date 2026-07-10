# キーフレーム編集回帰監査（Q4）

transform / 音量 / 速度キーフレームが、クリップ分割・リップルトリム・スリップ・スライド後も意図どおり保持・再配分されることを検証する。

## 実装経路

| 操作 | 実装 | キーフレームの扱い |
|------|------|-------------------|
| クリップ分割 (`splitClipAt`) | `projectStore.ts` | `splitTransformKeyframes` / `splitVolumeKeyframes` / `splitSpeedKeyframes` で両側へ再配分。分割点と一致する KF は両クリップに複製（右側は `time: 0`） |
| リップルトリム | `rippleTrimClipsOnTrack` (`clipUtils.ts`) | 後続クリップの `startTime` のみシフト。クリップ内 KF の `time` は変更しない |
| スリップ | `computeSlipClip` (`slipSlide.ts`) | `sourceStart` のみ変更。KF はそのまま |
| スライド | `slideClipOnTrack` (`slipSlide.ts`) | 隣接クリップのタイムライン位置・長さを調整。選択クリップの KF はそのまま |

## テストカバレッジ

| 領域 | ファイル | 内容 |
|------|----------|------|
| split 境界（3 種 KF） | `keyframeEditRegression.test.ts` | 分割点 `time === splitOffset` で両側複製 |
| split 統合 | `projectStore.test.ts` | transform / 音量 / 速度の `splitClipAt` |
| ripple | `keyframeEditRegression.test.ts`, `projectStore.test.ts`, `clipUtils.test.ts` | シフト後も KF 不変 |
| slip / slide | `keyframeEditRegression.test.ts`, `projectStore.test.ts`, `slipSlide.test.ts` | KF 時刻・値の保持 |
| E2E 分割 | `e2e/editor.spec.ts` | transform / 音量 / 速度 KF の分割後 UI 確認 |

## 既知の非対象

- リップル**削除**（`removeClip` with ripple）: クリップごと削除のため KF も消える（仕様）
- テキストクリップの transform KF: 分割は `splitClipAt` 共通経路だが、本 Q4 の E2E は映像・音声代表で検証
