# 写真ガイド連動スライドショー配置監査（v1.82.0）

最終更新: 2026-07-11（v1.82.0 / MVP 本番品質化）

## 目的

構造化ウェディングテンプレの**写真ガイドクリップ**を選択し、区間内へ写真を一括配置するワークフローについて、**50 枚超・複数ガイド区間**でも配置・削除・undo が破綻しないことを本番品質として回帰監視する。

## 配置経路

```
PhotoGuideSection（インスペクター）
  → addSlideshowToGuide（projectStore）
      → buildGuideSlideshowImageClips（photoGuideSlideshow.ts）
      → 映像トラックへ ImageClip 追加 + ガイド TextClip 削除
```

通常のメディアパネル「スライドショー作成」（`addSlideshow`）とは別経路。ガイド配置は **区間尺に合わせた durationPerImage** を自動計算する。

## 区間内収納（v1.82.0 修正）

| 条件 | `computeGuideSlideshowDurationPerImage` |
|------|----------------------------------------|
| 枚数が少ない | `max(MIN, guideDuration / count)`（MIN = 0.2 秒） |
| **50 枚超など MIN 適用で区間オーバーする場合** | `guideDuration / count` で**必ず区間内に収める** |

`guideSlideshowFitsRegion` / `getGuideSlideshowEndTime` でユニット回帰。

## ストレステスト

| 項目 | 値 |
|------|-----|
| 画像枚数 | `PHOTO_GUIDE_SLIDESHOW_STRESS_IMAGE_COUNT` = **52** |
| テンプレ | `structured-wedding`（ガイド 8 区間） |
| 投入 | `seedPhotoGuideSlideshowStress()` / `window.__FABLE_E2E__.loadPhotoGuideSlideshowStress` |

## 自動検証

| テスト | 内容 |
|--------|------|
| `photoGuideSlideshow.test.ts` | 52 枚収納・クリップ生成・MIN 境界 |
| `photoGuide.test.ts` | duration 計算 |
| `projectStore.test.ts` | 52 枚配置・複数ガイド・undo・無効 ID |
| E2E | 52 枚 UI・複数区間・undo |

## 関連ファイル

- `src/utils/photoGuideSlideshow.ts`
- `src/utils/photoGuide.ts`
- `src/utils/photoGuideStressSetup.ts`
- `src/components/PhotoGuideSection.tsx`
- `src/store/projectStore.ts` — `addSlideshowToGuide`
- `src/e2eBridge.ts`

## 既知の許容差分

| 項目 | 内容 |
|------|------|
| 極短ガイド + 大量枚数 | 1 枚あたり 0.1 秒未満になりうる（視認性は編集者判断） |
| ロック済み映像トラック | 配置先が無い場合は 0 枚（トーストで失敗） |
