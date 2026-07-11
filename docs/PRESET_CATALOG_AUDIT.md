# プリセットカタログ監査（Q10）

最終更新: 2026-07-11（v1.78.0 / Phase C Q10）

## 目的

テキスト / ルック / トランジションの組み込みプリセットを**新規追加せず**、カテゴリ絞り込みと「よく使う」で探しやすくする。

## 対象と UI 配置

| 種別 | 件数 | UI | カテゴリ |
|------|------|-----|----------|
| テキスト | 44 | `MediaPanel` テキストタブ | タイトル / ロワーサード / テロップ / MG |
| ルック | 22 | `ColorAdjustmentsSection` | ベーシック / ウェディング / ムード / フィルム |
| トランジション | 29 | `MediaPanel` 効果タブ | ディゾルブ / ウェディング / モーション |

MG テキストは `animation.type.startsWith('motion')` で仮想カテゴリ `motion` として扱う。

## 絞り込み UI

共通コンポーネント: `PresetCatalogControls`（チップ形式）

| チップ | 動作 |
|--------|------|
| すべて | 全件（テキストはカテゴリ見出し付き） |
| 各カテゴリ | 該当 category のみ |
| よく使う | localStorage 登録 ID のみ |

空のときは EmptyState または説明文を表示。

## よく使う（お気に入り）

| 項目 | 内容 |
|------|------|
| 保存 | `localStorage` キー `fable-preset-favorites` |
| 構造 | `{ text: string[], colorLook: string[], transition: string[] }` |
| API | `loadPresetFavorites` / `togglePresetFavorite` / `isPresetFavorite` |
| UI | `PresetFavoriteToggle`（☆ / ★） |

ユーザースタイル（テキストスタイル保存・マイルック）は別系統。Q10 の対象外。

## 関連ファイル

- `src/persistence/presetFavorites.ts`
- `src/utils/presetCatalog.ts`
- `src/components/PresetCatalogControls.tsx`
- `src/panels/MediaPanel.tsx`
- `src/components/ColorAdjustmentsSection.tsx`
- `src/utils/colorLooks.ts` — `category` メタデータ
- `src/utils/transitions.ts` — `category` メタデータ

## 自動検証

| テスト | 内容 |
|--------|------|
| `presetFavorites.test.ts` | toggle / 種別独立 |
| `presetCatalog.test.ts` | MG カテゴリ・よく使うフィルタ・category 網羅 |
| `colorLooks.test.ts` / `transitions.test.ts` | category 存在 |
| E2E | テキスト絞り込み・よく使う永続化 |
