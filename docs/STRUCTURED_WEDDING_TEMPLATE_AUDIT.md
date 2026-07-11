# 構造化ウェディングテンプレート拡張監査（v1.95.0）

最終更新: 2026-07-11（v1.95.0 / MVP 本番品質化）

## 目的

組み込みテンプレート **「結婚式フル構成」**（`structured-wedding`）について、章マーカー 5 件・写真ガイド 8 件・テキスト 3 件のフル構成が適用・undo・再適用で破綻しないことを本番品質として回帰監視する。

初回実装は v1.2.0。写真ガイド配置は [PHOTO_GUIDE_SLIDESHOW_AUDIT.md](./PHOTO_GUIDE_SLIDESHOW_AUDIT.md)（v1.82.0）、章マーカー編集は [MARKER_EDIT_AUDIT.md](./MARKER_EDIT_AUDIT.md)（v1.83.0）を参照。

## 適用経路

```
テンプレタブ「結婚式フル構成」
  → applyTemplate（projectStore, pushHistory=true）
    → buildTemplateTextClips（opening / thankyou / ending）
    → buildPhotoGuideClips（8 区間・「写真: 」プレフィックス）
    → buildTemplateMarkers（章 5 件）
  → テキストトラックへクリップ追加・markers へ章マーカー追加
```

`weddingTemplate.ts` がクリップ/マーカー生成を担当。`applyTemplate` は既存クリップに**追加**（上書きではない）。

## 構成（v1.95.0）

| 項目 | 件数 | 内容 |
|------|------|------|
| テキストクリップ | **3** | Opening / Thank you / Ending |
| 写真ガイド | **8** | 新郎・新婦プロフィール区間 + 二人の歩み |
| 章マーカー | **5** | オープニング〜エンディング |
| **合計クリップ** | **11** | テキスト 3 + ガイド 8 |

## エッジケース

| ケース | 挙動 |
|--------|------|
| **適用 undo** | 適用直前の空プロジェクト（クリップ 0・マーカー 0）に復元 |
| **再適用** | undo 後に UI から再適用で 11 クリップ・5 章が復元 |
| **二重適用** | クリップ/マーカーが累積追加（仕様。undo で巻き戻し） |
| **写真ガイド判定** | `isPhotoGuideClip` — テキストが `写真: ` で始まる |
| **章マーカー** | `type !== 'beat'` のマーカー |

## ストレステスト

| 項目 | 値 |
|------|-----|
| テンプレ ID | `structured-wedding` |
| 投入 | `seedStructuredWeddingTemplateStress()` / `loadStructuredWeddingTemplateStress` |
| 検証 | `getStructuredWeddingTemplateStressStats` / `getChapterMarkerCount` / `getPhotoGuideClipCount` |

E2E プレビューは `vite build --mode e2e`（`.env.e2e`）で `window.__FABLE_E2E__` を有効化。

## 自動検証

| テスト | 内容 |
|--------|------|
| `weddingTemplate.test.ts` | テキスト/マーカー/ガイド生成・11 件総数 |
| `structuredWeddingTemplateStressSetup.test.ts` | seed・undo・再適用 |
| `projectStore.test.ts` | applyTemplate・スライドショー配置・undo |
| E2E | ストレス11クリップ/5章・適用undo・再適用（既存: UI適用・ガイド配置52枚） |

## 関連ファイル

- `src/types/project.ts` — `PROJECT_TEMPLATES` / `structured-wedding`
- `src/utils/weddingTemplate.ts`
- `src/utils/structuredWeddingTemplateStressSetup.ts`
- `src/utils/photoGuide.ts`
- `src/store/projectStore.ts` — `applyTemplate`
- `src/e2eBridge.ts`

## 既知の許容差分

| 項目 | 内容 |
|------|------|
| メディア | テンプレ適用時点ではメディア未同梱（ガイドはテキストプレースホルダー） |
| 二重適用 | 累積追加。婚礼フローでは空プロジェクトまたは undo 後に適用を推奨 |
| ユーザーテンプレート | 保存/JSON は [USER_PROJECT_TEMPLATE_AUDIT.md](./USER_PROJECT_TEMPLATE_AUDIT.md) |
