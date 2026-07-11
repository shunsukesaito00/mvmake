# クリップのメディア差し替え監査（v1.88.0）

最終更新: 2026-07-11（v1.88.0 / MVP 本番品質化）

## 目的

インスペクターの**メディア差し替え**（同種 + 映像↔画像クロス）について、Ken Burns / 音声設定 / transform・transition の引き継ぎ、ロック拒否、undo、多数候補でも破綻しないことを本番品質として回帰監視する。

## 差し替え経路

```
ClipMediaReplaceSection（インスペクター「メディア」）
  → getMediaReplaceCandidates（候補列挙）
  → replaceClipMedia（projectStore）
      同種: computeMediaReplacement + { ...clip, ...updates }
      クロス: buildCrossVisualClip
  → pushHistory + clearMediaCache
```

## 引き継ぎルール（v1.88.0）

| 操作 | 維持される設定 |
|------|----------------|
| **画像→画像** | タイミング・長さ・Ken Burns・transform・transition |
| **動画→動画** | タイミング・長さ（短素材はクランプ）・audio・speed |
| **画像→動画** | transform・transition・タイミング。Ken Burns は video 型には載らず DEFAULT_AUDIO |
| **動画→画像** | transform・transition・タイミング・長さ。Ken Burns は DEFAULT（動画側には無い） |
| **音声→音声** | タイミング・長さ（素材尺でクランプ）・audio・ducking |

## 拒否条件

| 条件 | 挙動 |
|------|------|
| 同一 `mediaId` | `false`（no-op） |
| ロック済みトラック | `false` |
| 非対応型（例: 音声→映像） | `false` |
| 存在しないメディア ID | `false` |

## ストレステスト

| 項目 | 値 |
|------|-----|
| 映像・画像メディア | `MEDIA_REPLACE_STRESS_VISUAL_COUNT` = **10** |
| 音声メディア | `MEDIA_REPLACE_STRESS_AUDIO_COUNT` = **3** |
| 配置クリップ | 画像 1 + 動画 1（カスタム Ken Burns / 音量 0.42） |
| 投入 | `seedMediaReplaceStress()` / `loadMediaReplaceStress` |

E2E プレビューは `vite build --mode e2e`（`.env.e2e` で `VITE_E2E_BRIDGE=1`）により `window.__FABLE_E2E__` を有効化する。

## 自動検証

| テスト | 内容 |
|--------|------|
| `clipUtils.test.ts` | クロス差し替え・Ken Burns / transform 引き継ぎ |
| `projectStore.test.ts` | 同種・クロス・音声・ロック・undo |
| `mediaReplaceStressSetup.test.ts` | 候補 10 件・seed 投入 |
| E2E | 画像 undo・動画音量維持・ストレス候補/Ken Burns |

## 関連ファイル

- `src/utils/clipUtils.ts` — `canReplaceClipWithMedia` / `computeMediaReplacement` / `buildCrossVisualClip`
- `src/utils/mediaReplaceStressSetup.ts`
- `src/components/ClipMediaReplaceSection.tsx`
- `src/store/projectStore.ts` — `replaceClipMedia`
- `src/e2eBridge.ts`

## 既知の許容差分

| 項目 | 内容 |
|------|------|
| 画像→動画クロス | Ken Burns は video クリップに引き継がれない（型に存在しない） |
| 動画→画像クロス | Ken Burns は DEFAULT（動画側には無い。enabled は true） |
| undo | `selectedClipId` は null に戻る（配置 undo と同様） |
