/** `e2e/basic.spec.ts` = `npm run test:e2e:prod` の期待シナリオ数 */
export const PROD_SMOKE_SCENARIO_COUNT = 17

/** v2.1.1 で basic.spec に追加したシナリオ（test 名の部分一致用） */
export const PROD_SMOKE_V211_ADDITIONS = [
  'プロジェクト一覧',
  'テキスト内容の編集',
  'クイックスタート',
  'ショートカット一覧',
  'ユーザーテンプレート',
] as const
