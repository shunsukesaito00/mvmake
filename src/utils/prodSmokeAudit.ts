/** `e2e/basic.spec.ts` = `npm run test:e2e:prod` の期待シナリオ数 */
export const PROD_SMOKE_SCENARIO_COUNT = 22

/** v2.1.1 で basic.spec に追加したシナリオ（test 名の部分一致用） */
export const PROD_SMOKE_V211_ADDITIONS = [
  'プロジェクト一覧',
  'テキスト内容の編集',
  'クイックスタート',
  'ショートカット一覧',
  'ユーザーテンプレート',
] as const

/** v2.1.2 で basic.spec に追加したシナリオ（test 名の部分一致用） */
export const PROD_SMOKE_V212_ADDITIONS = [
  '画像をインポート',
  'undo で復元',
  'コピーしてペースト',
  '検索・種類フィルタ',
  'Escape で閉じ',
] as const
